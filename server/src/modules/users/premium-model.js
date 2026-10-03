import mongoose from 'mongoose';

const premiumSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    groupId: { type: String, required: true, index: true },
    setNumber: { type: Number, required: true },
    position: { type: Number, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    commissionRatio: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    kind: { type: String, enum: ['premium', 'fortune'], default: 'premium' },
    reward: { type: String, enum: ['project', 'cash'], default: 'project' },
    opened: { type: Boolean, default: false },
    charged: { type: Boolean, default: false },
  },
  { timestamps: true }
);

premiumSchema.index({ userId: 1, groupId: 1, setNumber: 1, position: 1 }, { unique: true });

export const UserPremium = mongoose.model('UserPremium', premiumSchema);

export function viewPremium(row) {
  const kind = row.kind === 'fortune' ? 'fortune' : 'premium';
  const reward = kind === 'fortune' && row.reward === 'cash' ? 'cash' : 'project';
  return {
    id: String(row._id),
    userId: row.userId,
    groupId: row.groupId,
    setNumber: Number(row.setNumber) === 2 || Number(row.setNumber) === 3 ? Number(row.setNumber) : 1,
    position: Number(row.position) || 1,
    name: row.name,
    price: row.price,
    commissionRatio: row.commissionRatio,
    commissionAmount: row.commissionAmount,
    kind,
    reward,
    opened: Boolean(row.opened),
    charged: Boolean(row.charged),
    box: kind === 'fortune',
    projectType: reward === 'cash' ? 'fortune' : 'premium',
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : '',
  };
}
