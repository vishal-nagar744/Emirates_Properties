import mongoose from 'mongoose';
import { ProjectGroup } from '../groups/model.js';
import { Order } from '../orders/model.js';
import { Project, viewProject } from './model.js';

function numberValue(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : NaN;
}

function money(value) {
  return Math.round(value * 100) / 100;
}

async function groupNames(projects) {
  const ids = [...new Set(projects.map((project) => project.groupId).filter(Boolean))];
  const groups = await ProjectGroup.find({ _id: { $in: ids } });
  return new Map(groups.map((group) => [String(group._id), group.name]));
}

function presentList(projects, names) {
  return projects.map((project) => viewProject(project, { groupName: names.get(project.groupId) || '' }));
}

async function readProject(body, current) {
  const name = String((body && body.name) ?? (current && current.name) ?? '').trim();
  const groupId = String((body && body.groupId) ?? (current && current.groupId) ?? '').trim();
  const price = numberValue(body && body.price !== undefined ? body.price : current && current.price);
  const commissionRatio = numberValue(body && body.commissionRatio !== undefined ? body.commissionRatio : current && current.commissionRatio);
  const status = String((body && body.status) || (current && current.status) || 'active');

  if (!name) return { status: 400, message: 'Enter a project name.' };
  if (!mongoose.isValidObjectId(groupId) || !(await ProjectGroup.exists({ _id: groupId }))) {
    return { status: 400, message: 'Choose a project group.' };
  }
  if (!Number.isFinite(price) || price < 0) return { status: 400, message: 'Enter a valid price.' };
  if (!Number.isFinite(commissionRatio) || commissionRatio < 0 || commissionRatio > 100) {
    return { status: 400, message: 'Commission ratio must be between 0 and 100.' };
  }
  if (status !== 'active' && status !== 'inactive') return { status: 400, message: 'Status must be active or inactive.' };

  return {
    value: {
      groupId,
      name,
      image: String((body && body.image) ?? (current && current.image) ?? '').trim(),
      description: String((body && body.description) ?? (current && current.description) ?? '').trim(),
      address: String((body && body.address) ?? (current && current.address) ?? '').trim(),
      developer: String((body && body.developer) ?? (current && current.developer) ?? '').trim(),
      price: money(price),
      commissionRatio: money(commissionRatio),
      commissionAmount: money((price * commissionRatio) / 100),
      status,
    },
  };
}

async function findProject(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Project.findById(id);
}

export async function listProjects({ includeInactive, groupId }) {
  const filter = includeInactive ? {} : { status: 'active' };
  if (groupId) {
    if (!mongoose.isValidObjectId(groupId)) return { status: 200, data: { projects: [] } };
    filter.groupId = groupId;
  }
  const rows = await Project.find(filter).sort({ createdAt: -1 });
  return { status: 200, data: { projects: presentList(rows, await groupNames(rows)) } };
}

export async function getProject(id) {
  const project = await findProject(id);
  if (!project) return { status: 404, message: 'Project not found.' };
  const names = await groupNames([project]);
  return { status: 200, data: { project: viewProject(project, { groupName: names.get(project.groupId) || '' }) } };
}

export async function createProject(body) {
  const parsed = await readProject(body);
  if (parsed.message) return parsed;
  const project = await Project.create(parsed.value);
  const names = await groupNames([project]);
  return { status: 201, data: { project: viewProject(project, { groupName: names.get(project.groupId) || '' }) } };
}

export async function updateProject(id, body) {
  const project = await findProject(id);
  if (!project) return { status: 404, message: 'Project not found.' };
  const parsed = await readProject(body, project);
  if (parsed.message) return parsed;
  Object.assign(project, parsed.value);
  await project.save();
  const names = await groupNames([project]);
  return { status: 200, data: { project: viewProject(project, { groupName: names.get(project.groupId) || '' }) } };
}

export async function setProjectStatus(id, status) {
  if (status !== 'active' && status !== 'inactive') return { status: 400, message: 'Status must be active or inactive.' };
  const project = await findProject(id);
  if (!project) return { status: 404, message: 'Project not found.' };
  project.status = status;
  await project.save();
  const names = await groupNames([project]);
  return { status: 200, data: { project: viewProject(project, { groupName: names.get(project.groupId) || '' }) } };
}

export async function deleteProject(id) {
  const project = await findProject(id);
  if (!project) return { status: 404, message: 'Project not found.' };
  const ordered = await Order.exists({ projectId: String(project._id), status: { $ne: 'cancelled' } });
  if (ordered) return { status: 409, message: 'This project already has an order, so it cannot be deleted.' };
  await project.deleteOne();
  return { status: 200, data: { ok: true, id: String(project._id) } };
}
