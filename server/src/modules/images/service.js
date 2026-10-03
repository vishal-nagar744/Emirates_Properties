import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { config } from '../../config.js';
import { ProjectGroup } from '../groups/model.js';
import { Order } from '../orders/model.js';
import { StoredImage } from './model.js';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

const types = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

export function groupImageUrl(id) {
  return `${config.publicApiUrl}/api/groups/${id}/image`;
}

export function orderImageUrl(id) {
  return `${config.publicApiUrl}/api/orders/${id}/image`;
}

export async function saveImage(file) {
  const doc = await StoredImage.create({
    data: file.buffer,
    contentType: file.mimetype,
  });
  return `${config.publicApiUrl}/api/images/${doc._id}`;
}

export async function readImage(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return StoredImage.findById(id).select('data contentType');
}

export async function discardStagedImage(id) {
  if (!id || !mongoose.isValidObjectId(id)) return;
  await StoredImage.deleteOne({ _id: id });
}

function imageIdFromRef(value) {
  const image = String(value || '').trim();
  if (!image) return '';
  let pathname = image;
  if (/^https?:\/\//i.test(image)) {
    try {
      pathname = new URL(image).pathname;
    } catch {
      return '';
    }
  }
  const match = pathname.match(/^\/api\/images\/([a-f0-9]{24})$/i);
  return match ? match[1] : '';
}

function locateUpload(value) {
  let pathname = String(value || '');
  try {
    pathname = new URL(pathname).pathname;
  } catch {
    /* already a path */
  }
  if (!pathname.includes('/uploads/')) return '';
  const filename = path.basename(pathname);
  if (!filename || filename === '.' || filename === '..') return '';
  const dirs = [config.uploadDir, path.join(serverRoot, 'uploads')];
  for (const dir of dirs) {
    const full = path.join(dir, filename);
    if (fs.existsSync(full)) return full;
  }
  return '';
}

export async function loadImageBytes(value) {
  const image = String(value || '').trim();
  if (!image) return { data: null, contentType: '' };
  if (image.startsWith('blob:')) return { error: 'Upload the photo. It is not kept in the browser.' };

  const stagedId = imageIdFromRef(image);
  if (stagedId) {
    const stored = await readImage(stagedId);
    if (!stored || !stored.data || !stored.data.length) return { error: 'Upload the photo before saving.' };
    return { data: stored.data, contentType: stored.contentType, stagedId };
  }

  const file = locateUpload(image);
  if (file) {
    const contentType = types[path.extname(file).toLowerCase()];
    if (!contentType) return { error: 'Upload a JPG, PNG, WEBP, or GIF image.' };
    return { data: fs.readFileSync(file), contentType };
  }

  const dataUrl = image.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([a-z0-9+/=\s]+)$/i);
  if (dataUrl) {
    return { data: Buffer.from(dataUrl[2].replace(/\s/g, ''), 'base64'), contentType: dataUrl[1].toLowerCase() };
  }

  return { error: 'Upload the photo before saving.' };
}

async function embedCollection(collection, stagedIds) {
  await collection.updateMany({ image: { $in: ['', null] } }, { $unset: { image: '' } });
  const rows = await collection.find({ image: { $type: 'string' } }).toArray();
  let moved = 0;
  for (const row of rows) {
    const loaded = await loadImageBytes(row.image);
    if (!loaded || loaded.error || !loaded.data) {
      console.warn(`Left image unchanged for ${row._id}.`);
      continue;
    }
    await collection.updateOne(
      { _id: row._id },
      { $set: { image: { data: loaded.data, contentType: loaded.contentType } } }
    );
    moved += 1;
    if (loaded.stagedId) stagedIds.push(loaded.stagedId);
  }
  return moved;
}

export async function embedImageBytes() {
  const stagedIds = [];
  const groups = await embedCollection(ProjectGroup.collection, stagedIds);
  const orders = await embedCollection(Order.collection, stagedIds);
  if (stagedIds.length) await StoredImage.deleteMany({ _id: { $in: stagedIds } });
  return groups + orders;
}
