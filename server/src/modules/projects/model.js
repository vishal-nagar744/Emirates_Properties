import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    groupId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    image: { type: String, default: '' },
    description: { type: String, default: '' },
    address: { type: String, default: '' },
    developer: { type: String, default: '' },
    price: { type: Number, required: true },
    commissionRatio: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export const Project = mongoose.model('Project', projectSchema);

export function viewProject(project, extra = {}) {
  return {
    id: String(project._id),
    groupId: project.groupId || '',
    groupName: extra.groupName || '',
    name: project.name,
    image: project.image || '',
    description: project.description || '',
    address: project.address || '',
    developer: project.developer || '',
    price: project.price,
    commissionRatio: project.commissionRatio,
    commissionAmount: project.commissionAmount,
    status: project.status,
    createdAt: project.createdAt ? new Date(project.createdAt).toISOString() : '',
  };
}
