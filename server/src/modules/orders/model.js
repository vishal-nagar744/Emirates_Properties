import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    projectId: { type: String, required: true },
    projectName: { type: String, required: true },
    image: { type: String, default: '' },
    activationAmount: { type: Number, required: true },
    dailyCommission: { type: Number, required: true },
    durationDays: { type: Number, required: true },
    totalCommission: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    daysCompleted: { type: Number, default: 0 },
    earnedCommission: { type: Number, default: 0 },
    remainingCommission: { type: Number, required: true },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  },
  { timestamps: true }
);

export const Order = mongoose.model('Order', orderSchema);

export function viewOrder(order) {
  return {
    id: String(order._id),
    userId: order.userId,
    projectId: order.projectId,
    projectName: order.projectName,
    image: order.image || '',
    activationAmount: order.activationAmount,
    dailyCommission: order.dailyCommission,
    durationDays: order.durationDays,
    totalCommission: order.totalCommission,
    startDate: new Date(order.startDate).toISOString(),
    endDate: new Date(order.endDate).toISOString(),
    daysCompleted: order.daysCompleted,
    earnedCommission: order.earnedCommission,
    remainingCommission: order.remainingCommission,
    status: order.status,
    createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : '',
  };
}
