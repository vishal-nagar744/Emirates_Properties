import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    groupId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    commissionRatio: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
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
    price: project.price,
    commissionRatio: project.commissionRatio,
    commissionAmount: project.commissionAmount,
    createdAt: project.createdAt ? new Date(project.createdAt).toISOString() : '',
  };
}
