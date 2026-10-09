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

function priceOrder(a, b) {
  return (Number(a.price) || 0) - (Number(b.price) || 0)
    || String(a.createdAt || '').localeCompare(String(b.createdAt || ''));
}

export function itemId(item) {
  return String((item && (item.id || item._id)) || '');
}

export function setNumberOf(item) {
  const value = Number(item && item.setNumber);
  return value === 2 || value === 3 ? value : 1;
}

export function setSequence(projects, premiums = []) {
  const list = projects
    .filter((project) => project.projectType !== 'premium')
    .slice()
    .sort(priceOrder);
  const inserts = premiums.slice().sort((a, b) => (
    (Number(a.position) || 0) - (Number(b.position) || 0)
    || String(a.createdAt || '').localeCompare(String(b.createdAt || ''))
  ));
  inserts.forEach((premium) => {
    const at = Math.max(0, (Number(premium.position) || (list.length + 1)) - 1);
    list.splice(Math.min(at, list.length), 0, premium);
  });
  return list;
}

export function nextGroupProject(projects, premiums, doneIds) {
  return nextAccessibleProject(projects, premiums, doneIds).item;
}

export function nextAccessibleProject(projects, premiums, doneIds, isSetOpen) {
  for (const setNumber of [1, 2, 3]) {
    const sequence = setSequence(
      projects.filter((project) => setNumberOf(project) === setNumber),
      premiums.filter((premium) => setNumberOf(premium) === setNumber),
    );
    if (!sequence.length) continue;
    const next = sequence.find((item) => !doneIds.has(itemId(item)));
    if (!next) continue;
    if (typeof isSetOpen === 'function' && !isSetOpen(setNumber)) {
      return { item: null, lockedSet: setNumber };
    }
    return { item: next, lockedSet: null };
  }
  return { item: null, lockedSet: null };
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

  if (!name) return { status: 400, message: 'Enter a project name.' };
  if (!mongoose.isValidObjectId(groupId) || !(await ProjectGroup.exists({ _id: groupId }))) {
    return { status: 400, message: 'Choose a project group.' };
  }
  if (!Number.isFinite(price) || price < 0) return { status: 400, message: 'Enter a valid price.' };
  if (!Number.isFinite(commissionRatio) || commissionRatio < 0 || commissionRatio > 100) {
    return { status: 400, message: 'Commission ratio must be between 0 and 100.' };
  }
  const rawSet = body && body.setNumber !== undefined ? body.setNumber : current && current.setNumber;
  const setNumber = Number(rawSet) === 2 || Number(rawSet) === 3 ? Number(rawSet) : 1;

  return {
    value: {
      groupId,
      name,
      price: money(price),
      commissionRatio: money(commissionRatio),
      commissionAmount: money((price * commissionRatio) / 100),
      projectType: 'normal',
      setNumber,
    },
  };
}

async function findProject(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Project.findById(id);
}

export async function listProjects({ groupId }) {
  const filter = {};
  if (groupId) {
    if (!mongoose.isValidObjectId(groupId)) return { status: 200, data: { projects: [] } };
    filter.groupId = groupId;
  }
  const rows = await Project.find(filter).sort({ setNumber: 1, price: 1, createdAt: 1 });
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

export async function setProjectStatus() {
  return { status: 400, message: 'Project status is no longer used.' };
}

export async function deleteProject(id) {
  const project = await findProject(id);
  if (!project) return { status: 404, message: 'Project not found.' };
  const ordered = await Order.exists({ projectId: String(project._id), status: { $ne: 'cancelled' } });
  if (ordered) return { status: 409, message: 'This project already has an order, so it cannot be deleted.' };
  await project.deleteOne();
  return { status: 200, data: { ok: true, id: String(project._id) } };
}
