import mongoose from 'mongoose';

const cashoutSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    mobile: { type: String, required: true },
    amount: { type: Number, required: true },
    method: { type: String, required: true },
    destination: { type: String, required: true },
    accountId: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'rejected'],
      default: 'pending',
    },
    rejectionReason: { type: String, default: '' },
    requestedAt: { type: Date, required: true },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Cashout = mongoose.model('Cashout', cashoutSchema);

export function viewCashout(row) {
  return {
    id: String(row._id),
    userId: row.userId,
    userName: row.userName,
    mobile: row.mobile,
    amount: row.amount,
    method: row.method,
    destination: row.destination,
    accountId: row.accountId,
    status: row.status,
    rejectionReason: row.rejectionReason || '',
    requestedAt: row.requestedAt ? new Date(row.requestedAt).toISOString() : '',
    processedAt: row.processedAt ? new Date(row.processedAt).toISOString() : null,
  };
}
