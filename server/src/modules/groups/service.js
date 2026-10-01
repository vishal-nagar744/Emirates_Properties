import mongoose from 'mongoose';
import { Project } from '../projects/model.js';
import { ProjectGroup, viewGroup } from './model.js';

async function findGroup(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return ProjectGroup.findById(id);
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

function imageRef(value) {
  const image = String(value || '').trim();
  if (!image) return '';
  if (image.startsWith('data:') || image.startsWith('blob:')) {
    return { error: 'Upload the photo. It is not kept in the browser.' };
  }
  if (image.startsWith('/uploads/')) return image;
  try {
    const url = new URL(image);
    if ((url.protocol === 'http:' || url.protocol === 'https:') && url.pathname.startsWith('/uploads/')) return image;
  } catch {
    /* not a stored upload */
  }
  return { error: 'Upload the photo before saving.' };
}

function readGroup(body, current) {
  const name = String((body && body.name) ?? (current && current.name) ?? '').trim();
  if (!name) return { status: 400, message: 'Enter a group name.' };
  const imageInput = String((body && body.image) ?? (current && current.image) ?? '').trim();
  const image = imageRef(imageInput);
  if (image && image.error && imageInput !== String((current && current.image) || '')) {
    return { status: 400, message: image.error };
  }
  return {
    value: {
      name,
      description: String((body && body.description) ?? (current && current.description) ?? '').trim(),
      image: image && image.error ? imageInput : image,
    },
  };
}

export async function listGroups() {
  const groups = await ProjectGroup.find().sort({ createdAt: -1 });
  return { status: 200, data: { groups: await withCounts(groups) } };
}

export async function getGroup(id) {
  const group = await findGroup(id);
  if (!group) return { status: 404, message: 'Group not found.' };
  const [view] = await withCounts([group]);
  return { status: 200, data: { group: view } };
}

export async function createGroup(body) {
  const parsed = readGroup(body);
  if (parsed.message) return parsed;
  const group = await ProjectGroup.create(parsed.value);
  return { status: 201, data: { group: viewGroup(group, { projectCount: 0 }) } };
}

export async function updateGroup(id, body) {
  const group = await findGroup(id);
  if (!group) return { status: 404, message: 'Group not found.' };
  const parsed = readGroup(body, group);
  if (parsed.message) return parsed;
  Object.assign(group, parsed.value);
  await group.save();
  const [view] = await withCounts([group]);
  return { status: 200, data: { group: view } };
}

export async function deleteGroup(id) {
  const group = await findGroup(id);
  if (!group) return { status: 404, message: 'Group not found.' };
  const used = await Project.exists({ groupId: String(group._id) });
  if (used) return { status: 409, message: 'Remove the projects in this group before deleting it.' };
  await group.deleteOne();
  return { status: 200, data: { ok: true, id: String(group._id) } };
}
