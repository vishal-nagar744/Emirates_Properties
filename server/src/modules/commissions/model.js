import mongoose from 'mongoose';

const commissionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    orderId: { type: String, required: true, index: true },
    projectId: { type: String, required: true },
    projectName: { type: String, required: true },
    groupName: { type: String, default: '' },
    amount: { type: Number, required: true },
    dayIndex: { type: Number, required: true },
    date: { type: String, required: true },
    status: { type: String, default: 'completed' },
  },
  { timestamps: true }
);

commissionSchema.index({ orderId: 1, date: 1 }, { unique: true });

export const Commission = mongoose.model('Commission', commissionSchema);

export function viewCommission(row) {
  return {
    id: String(row._id),
    userId: row.userId,
    orderId: row.orderId,
    projectId: row.projectId,
    projectName: row.projectName,
    groupName: row.groupName || '',
    amount: row.amount,
    dayIndex: row.dayIndex,
    date: row.date,
    status: row.status,
  };
}
