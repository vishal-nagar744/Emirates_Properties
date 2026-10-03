import mongoose from 'mongoose';
import { config } from '../../config.js';
import { orderWorkDate } from '../../lib/workDate.js';

const orderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    projectId: { type: String, required: true },
    projectName: { type: String, required: true },
    groupId: { type: String, default: '' },
    groupName: { type: String, default: '' },
    image: {
      data: { type: Buffer },
      contentType: { type: String, default: '' },
    },
    price: { type: Number, default: 0 },
    commissionRatio: { type: Number, default: 0 },
    commissionAmount: { type: Number, default: 0 },
    activationAmount: { type: Number, default: 0 },
    dailyCommission: { type: Number, default: 0 },
    durationDays: { type: Number, default: 0 },
    totalCommission: { type: Number, default: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    daysCompleted: { type: Number, default: 0 },
    earnedCommission: { type: Number, default: 0 },
    remainingCommission: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'completed' },
    workDate: { type: String, default: '', index: true },
  },
  { timestamps: true }
);

export const Order = mongoose.model('Order', orderSchema);

export function viewOrder(order) {
  const commissionAmount = Number(order.commissionAmount) || Number(order.earnedCommission) || Number(order.totalCommission) || 0;
  return {
    id: String(order._id),
    userId: order.userId,
    projectId: order.projectId,
    projectName: order.projectName,
    groupId: order.groupId || '',
    groupName: order.groupName || '',
    image: order.image && order.image.contentType ? `${config.publicApiUrl}/api/orders/${order._id}/image` : '',
    price: Number(order.price) || Number(order.activationAmount) || 0,
    commissionRatio: Number(order.commissionRatio) || 0,
    commissionAmount,
    earnedCommission: Number(order.earnedCommission) || 0,
    status: order.status,
    workDate: orderWorkDate(order),
    createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : '',
  };
}
