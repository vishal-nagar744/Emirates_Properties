import mongoose from 'mongoose';
import { Order } from '../orders/model.js';
import { Project, viewProject } from './model.js';

function numberValue(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : NaN;
}

function readProject(body, current) {
  const name = String((body && body.name) ?? (current && current.name) ?? '').trim();
  const activationAmount = numberValue(body && body.activationAmount !== undefined ? body.activationAmount : current && current.activationAmount);
  const dailyCommission = numberValue(body && body.dailyCommission !== undefined ? body.dailyCommission : current && current.dailyCommission);
  const durationDays = numberValue(body && body.durationDays !== undefined ? body.durationDays : current && current.durationDays);
  const status = String((body && body.status) || (current && current.status) || 'active');

  if (!name) return { status: 400, message: 'Enter a project name.' };
  if (!Number.isFinite(activationAmount) || activationAmount < 0) return { status: 400, message: 'Enter a valid activation amount.' };
  if (!Number.isFinite(dailyCommission) || dailyCommission < 0) return { status: 400, message: 'Enter a valid daily commission.' };
  if (!Number.isInteger(durationDays) || durationDays < 1) return { status: 400, message: 'Duration must be at least 1 day.' };
  if (status !== 'active' && status !== 'inactive') return { status: 400, message: 'Status must be active or inactive.' };

  return {
    value: {
      name,
      image: String((body && body.image) ?? (current && current.image) ?? '').trim(),
      description: String((body && body.description) ?? (current && current.description) ?? '').trim(),
      address: String((body && body.address) ?? (current && current.address) ?? '').trim(),
      developer: String((body && body.developer) ?? (current && current.developer) ?? '').trim(),
      tag: String((body && body.tag) || (current && current.tag) || 'Project').trim() || 'Project',
      activationAmount,
      dailyCommission,
      durationDays,
      totalCommission: dailyCommission * durationDays,
      commissionFrequency: 'daily',
      status,
    },
  };
}

async function findProject(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Project.findById(id);
}

export async function listProjects({ includeInactive }) {
  const filter = includeInactive ? {} : { status: 'active' };
  const rows = await Project.find(filter).sort({ createdAt: -1 });
  return { status: 200, data: { projects: rows.map(viewProject) } };
}

export async function getProject(id) {
  const project = await findProject(id);
  if (!project) return { status: 404, message: 'Project not found.' };
  return { status: 200, data: { project: viewProject(project) } };
}

export async function createProject(body) {
  const parsed = readProject(body);
  if (parsed.message) return parsed;
  const project = await Project.create(parsed.value);
  return { status: 201, data: { project: viewProject(project) } };
}

export async function updateProject(id, body) {
  const project = await findProject(id);
  if (!project) return { status: 404, message: 'Project not found.' };
  const parsed = readProject(body, project);
  if (parsed.message) return parsed;
  Object.assign(project, parsed.value);
  await project.save();
  return { status: 200, data: { project: viewProject(project) } };
}

export async function setProjectStatus(id, status) {
  if (status !== 'active' && status !== 'inactive') return { status: 400, message: 'Status must be active or inactive.' };
  const project = await findProject(id);
  if (!project) return { status: 404, message: 'Project not found.' };
  project.status = status;
  await project.save();
  return { status: 200, data: { project: viewProject(project) } };
}

export async function deleteProject(id) {
  const project = await findProject(id);
  if (!project) return { status: 404, message: 'Project not found.' };
  const running = await Order.exists({ projectId: String(project._id), status: 'active' });
  if (running) {
    return { status: 409, message: 'This project still has an active order. Close those orders before deleting it.' };
  }
  await project.deleteOne();
  return { status: 200, data: { ok: true, id: String(project._id) } };
}
