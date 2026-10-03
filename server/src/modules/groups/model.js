import mongoose from 'mongoose';
import { config } from '../../config.js';

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    unlockDeposit: { type: Number, default: 0 },
    image: {
      data: { type: Buffer },
      contentType: { type: String, default: '' },
    },
    isTrial: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ProjectGroup = mongoose.model('ProjectGroup', groupSchema);

export function hasImage(record) {
  return Boolean(record && record.image && record.image.contentType);
}

export function viewGroup(group, extra = {}) {
  return {
    id: String(group._id),
    name: group.name,
    description: group.description || '',
    unlockDeposit: Number(group.unlockDeposit) || 0,
    image: hasImage(group) ? `${config.publicApiUrl}/api/groups/${group._id}/image` : '',
    isTrial: Boolean(group.isTrial),
    projectCount: extra.projectCount || 0,
    createdAt: group.createdAt ? new Date(group.createdAt).toISOString() : '',
  };
}
