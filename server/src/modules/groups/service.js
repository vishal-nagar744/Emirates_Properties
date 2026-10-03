import mongoose from 'mongoose';
import { config } from '../../config.js';
import { discardStagedImage, loadImageBytes } from '../images/service.js';
import { Project } from '../projects/model.js';
import { ProjectGroup, hasImage, viewGroup } from './model.js';

async function findGroup(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return ProjectGroup.findById(id).select('-image.data');
}

async function withCounts(groups) {
  const ids = groups.map((group) => String(group._id));
  const rows = await Project.aggregate([
    { $match: { groupId: { $in: ids } } },
    { $group: { _id: '$groupId', count: { $sum: 1 } } },
  ]);
  const counts = new Map(rows.map((row) => [String(row._id), row.count]));
  return groups.map((group) => viewGroup(group, { projectCount: counts.get(String(group._id)) || 0 }));
}

function readGroup(body, current) {
  const name = String((body && body.name) ?? (current && current.name) ?? '').trim();
  if (!name) return { status: 400, message: 'Enter a group name.' };
  const hasImageInput = Boolean(body) && Object.prototype.hasOwnProperty.call(body, 'image');
  return {
    value: {
      name,
      description: String((body && body.description) ?? (current && current.description) ?? '').trim(),
    },
    imageInput: hasImageInput ? body.image : undefined,
  };
}

function keepsCurrentImage(current, image) {
  if (!hasImage(current)) return false;
  const owned = `${config.publicApiUrl}/api/groups/${current._id}/image`;
  return image === owned || image.endsWith(`/api/groups/${current._id}/image`);
}

async function takeImage(imageInput, current) {
  if (imageInput === undefined) return { keep: true };
  const image = String(imageInput || '').trim();
  if (!image) return { data: null, contentType: '' };
  if (keepsCurrentImage(current, image)) return { keep: true };
  return loadImageBytes(image);
}

function writeImage(group, image) {
  if (!image || image.keep) return;
  group.image = image.data
    ? { data: image.data, contentType: image.contentType }
    : undefined;
}

export async function listGroups() {
  const groups = await ProjectGroup.find().select('-image.data').sort({ createdAt: 1 });
  return { status: 200, data: { groups: await withCounts(groups) } };
}

export async function getGroup(id) {
  const group = await findGroup(id);
  if (!group) return { status: 404, message: 'Group not found.' };
  const [view] = await withCounts([group]);
  return { status: 200, data: { group: view } };
}

export async function readGroupImage(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  const group = await ProjectGroup.findById(id).select('image.data image.contentType');
  if (!group || !group.image || !group.image.contentType || !group.image.data || !group.image.data.length) return null;
  return { data: group.image.data, contentType: group.image.contentType };
}

export async function createGroup(body) {
  const parsed = readGroup(body);
  if (parsed.message) return parsed;
  const image = await takeImage(parsed.imageInput, null);
  if (image && image.error) return { status: 400, message: image.error };
  const group = new ProjectGroup(parsed.value);
  writeImage(group, image);
  await group.save();
  if (image && image.stagedId) await discardStagedImage(image.stagedId);
  return { status: 201, data: { group: viewGroup(group, { projectCount: 0 }) } };
}

export async function updateGroup(id, body) {
  const group = await findGroup(id);
  if (!group) return { status: 404, message: 'Group not found.' };
  const parsed = readGroup(body, group);
  if (parsed.message) return parsed;
  const image = await takeImage(parsed.imageInput, group);
  if (image && image.error) return { status: 400, message: image.error };
  const update = { $set: parsed.value };
  if (image && !image.keep) {
    if (image.data) update.$set.image = { data: image.data, contentType: image.contentType };
    else update.$unset = { image: '' };
  }
  await ProjectGroup.updateOne({ _id: group._id }, update);
  if (image && image.stagedId) await discardStagedImage(image.stagedId);
  const saved = await findGroup(id);
  const [view] = await withCounts([saved]);
  return { status: 200, data: { group: view } };
}

export async function deleteGroup(id) {
  const group = await findGroup(id);
  if (!group) return { status: 404, message: 'Group not found.' };
  if (group.isTrial) return { status: 400, message: 'The trial group cannot be deleted.' };
  const used = await Project.exists({ groupId: String(group._id) });
  if (used) return { status: 409, message: 'Remove the projects in this group before deleting it.' };
  await group.deleteOne();
  return { status: 200, data: { ok: true, id: String(group._id) } };
}
