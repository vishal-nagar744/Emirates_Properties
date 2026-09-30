import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    image: { type: String, default: '' },
    description: { type: String, default: '' },
    address: { type: String, default: '' },
    developer: { type: String, default: '' },
    tag: { type: String, default: 'Project' },
    activationAmount: { type: Number, required: true },
    dailyCommission: { type: Number, required: true },
    commissionFrequency: { type: String, default: 'daily' },
    durationDays: { type: Number, required: true },
    totalCommission: { type: Number, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export const Project = mongoose.model('Project', projectSchema);

export function viewProject(project) {
  return {
    id: String(project._id),
    name: project.name,
    image: project.image || '',
    description: project.description || '',
    address: project.address || '',
    developer: project.developer || '',
    tag: project.tag || 'Project',
    activationAmount: project.activationAmount,
    dailyCommission: project.dailyCommission,
    commissionFrequency: project.commissionFrequency || 'daily',
    durationDays: project.durationDays,
    totalCommission: project.totalCommission,
    status: project.status,
    createdAt: project.createdAt ? new Date(project.createdAt).toISOString() : '',
  };
}
