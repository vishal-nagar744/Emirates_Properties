import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
  },
  { timestamps: true }
);

export const ProjectGroup = mongoose.model('ProjectGroup', groupSchema);

export function viewGroup(group, extra = {}) {
  return {
    id: String(group._id),
    name: group.name,
    description: group.description || '',
    image: group.image || '',
    projectCount: extra.projectCount || 0,
    createdAt: group.createdAt ? new Date(group.createdAt).toISOString() : '',
  };
}
