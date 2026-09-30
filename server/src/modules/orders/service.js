import mongoose from 'mongoose';
import { Commission } from '../commissions/model.js';
import { Project } from '../projects/model.js';
import { Transaction } from '../wallet/model.js';
import { User } from '../users/model.js';
import { Order, viewOrder } from './model.js';

function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function memberView(user) {
  return {
    id: String(user._id),
    fullName: user.fullName,
    mobile: user.mobile,
    accountStatus: user.accountStatus,
    referralCode: user.referralCode,
    walletBalance: user.walletBalance,
    pendingCashOut: user.pendingCashOut || 0,
    hasSecurityPassword: Boolean(user.securityPasswordHash),
    hasWithdrawalPassword: Boolean(user.withdrawalPasswordHash),
  };
}

async function findOrder(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Order.findById(id);
}

export async function listOrders({ userId, all }) {
  const filter = all ? {} : { userId: String(userId) };
  const rows = await Order.find(filter).sort({ createdAt: -1 });
  return { status: 200, data: { orders: rows.map(viewOrder) } };
}

export async function getOrder({ id, userId, admin }) {
  const order = await findOrder(id);
  if (!order) return { status: 404, message: 'Order not found.' };
  if (!admin && order.userId !== String(userId)) return { status: 404, message: 'Order not found.' };
  return { status: 200, data: { order: viewOrder(order) } };
}

export async function activateOrder({ userId, projectId }) {
  if (!mongoose.isValidObjectId(userId)) return { status: 401, message: 'Sign in required.' };
  const user = await User.findById(userId);
  if (!user || user.role !== 'user') return { status: 401, message: 'Sign in required.' };
  if (user.accountStatus === 'pending') return { status: 403, message: 'Your account is pending admin approval.' };
  if (user.accountStatus === 'blocked') return { status: 403, message: 'This account is blocked.' };
  if (user.accountStatus === 'suspended') return { status: 403, message: 'This account is suspended.' };
  if (!mongoose.isValidObjectId(projectId)) return { status: 404, message: 'This project is not available.' };

  const project = await Project.findById(projectId);
  if (!project || project.status !== 'active') return { status: 404, message: 'This project is not available.' };

  const already = await Order.findOne({
    userId: String(user._id),
    projectId: String(project._id),
    status: { $ne: 'cancelled' },
  });
  if (already) return { status: 409, message: 'You have already submitted an order for this project.' };

  const now = new Date();
  const amount = Number(project.commissionAmount) || 0;
  const order = await Order.create({
    userId: String(user._id),
    projectId: String(project._id),
    projectName: project.name,
    image: project.image || '',
    price: project.price,
    commissionRatio: project.commissionRatio,
    commissionAmount: amount,
    earnedCommission: amount,
    remainingCommission: 0,
    startDate: now,
    endDate: now,
    status: 'completed',
  });

  user.walletBalance += amount;
  await user.save();

  await Commission.create({
    userId: String(user._id),
    orderId: String(order._id),
    projectId: String(project._id),
    projectName: project.name,
    amount,
    dayIndex: 1,
    date: dayKey(now),
    status: 'completed',
  });

  await Transaction.create({
    userId: String(user._id),
    type: 'project_commission',
    amount,
    direction: 'credit',
    description: `Commission · ${project.name}`,
    status: 'completed',
    referenceId: String(order._id),
  });

  return { status: 201, data: { order: viewOrder(order), user: memberView(user) } };
}
