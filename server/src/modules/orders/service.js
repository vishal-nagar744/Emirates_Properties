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

function addCalendarDays(iso, days) {
  const base = new Date(iso);
  base.setHours(12, 0, 0, 0);
  base.setDate(base.getDate() + days);
  return dayKey(base);
}

function nextLabel(order) {
  if (order.status !== 'active') return '—';
  const next = addCalendarDays(order.startDate, order.daysCompleted + 1);
  const today = dayKey();
  if (next === today) return 'Today';
  if (next === addCalendarDays(new Date(), 1)) return 'Tomorrow';
  return next;
}

function present(order) {
  return { ...viewOrder(order), nextLabel: nextLabel(order) };
}

async function settleOrder(order, user) {
  const today = dayKey();
  let guard = 0;
  while (order.status === 'active' && order.daysCompleted < order.durationDays && guard < 400) {
    guard += 1;
    const next = addCalendarDays(order.startDate, order.daysCompleted + 1);
    if (next > today) break;
    const existing = await Commission.findOne({ orderId: String(order._id), date: next });
    order.daysCompleted += 1;
    if (!existing) {
      try {
        await Commission.create({
          userId: order.userId,
          orderId: String(order._id),
          projectId: order.projectId,
          projectName: order.projectName,
          amount: order.dailyCommission,
          dayIndex: order.daysCompleted,
          date: next,
          status: 'completed',
        });
        order.earnedCommission += order.dailyCommission;
        order.remainingCommission = Math.max(0, order.remainingCommission - order.dailyCommission);
        if (user) user.walletBalance += order.dailyCommission;
        await Transaction.create({
          userId: order.userId,
          type: 'daily_commission',
          amount: order.dailyCommission,
          direction: 'credit',
          description: `Daily commission · ${order.projectName}`,
          status: 'completed',
          referenceId: String(order._id),
        });
      } catch (err) {
        if (!err || err.code !== 11000) throw err;
      }
    }
    if (order.daysCompleted >= order.durationDays) {
      order.status = 'completed';
      order.remainingCommission = 0;
    }
  }
  await order.save();
  if (user) await user.save();
}

export async function settleUser(userId) {
  const user = await User.findById(userId);
  const orders = await Order.find({ userId: String(userId), status: 'active' });
  for (const order of orders) {
    await settleOrder(order, user);
  }
}

async function findOrder(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Order.findById(id);
}

export async function listOrders({ userId, all }) {
  if (!all && userId) await settleUser(userId);
  if (all) {
    const active = await Order.find({ status: 'active' });
    for (const order of active) {
      const user = await User.findById(order.userId);
      await settleOrder(order, user);
    }
  }
  const filter = all ? {} : { userId: String(userId) };
  const rows = await Order.find(filter).sort({ createdAt: -1 });
  return { status: 200, data: { orders: rows.map(present) } };
}

export async function getOrder({ id, userId, admin }) {
  const order = await findOrder(id);
  if (!order) return { status: 404, message: 'Order not found.' };
  if (!admin && order.userId !== String(userId)) return { status: 404, message: 'Order not found.' };
  if (order.status === 'active') {
    const user = await User.findById(order.userId);
    await settleOrder(order, user);
  }
  return { status: 200, data: { order: present(order) } };
}

export async function activateOrder({ userId, projectId }) {
  if (!mongoose.isValidObjectId(userId)) return { status: 401, message: 'Sign in required.' };
  const user = await User.findById(userId);
  if (!user || user.role !== 'user') return { status: 401, message: 'Sign in required.' };
  if (user.accountStatus === 'frozen') return { status: 403, message: 'Your account is currently frozen. Please contact support.' };
  if (user.accountStatus === 'suspended') return { status: 403, message: 'Account suspended. Contact support.' };
  if (!mongoose.isValidObjectId(projectId)) return { status: 404, message: 'This project is not available.' };

  const project = await Project.findById(projectId);
  if (!project || project.status !== 'active') return { status: 404, message: 'This project is not available.' };

  const already = await Order.findOne({ userId: String(user._id), projectId: String(project._id), status: 'active' });
  if (already) return { status: 409, message: 'You already have an active order for this project.' };
  if (user.walletBalance < project.activationAmount) {
    return { status: 400, message: 'Insufficient balance. Add funds to your wallet.' };
  }

  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + project.durationDays);
  user.walletBalance -= project.activationAmount;
  await user.save();

  const order = await Order.create({
    userId: String(user._id),
    projectId: String(project._id),
    projectName: project.name,
    image: project.image || '',
    activationAmount: project.activationAmount,
    dailyCommission: project.dailyCommission,
    durationDays: project.durationDays,
    totalCommission: project.totalCommission,
    startDate: start,
    endDate: end,
    daysCompleted: 0,
    earnedCommission: 0,
    remainingCommission: project.totalCommission,
    status: 'active',
  });

  await Transaction.create({
    userId: String(user._id),
    type: 'project_activation',
    amount: project.activationAmount,
    direction: 'debit',
    description: `Activated ${project.name}`,
    status: 'completed',
    referenceId: String(order._id),
  });

  return {
    status: 201,
    data: {
      order: present(order),
      user: {
        id: String(user._id),
        walletBalance: user.walletBalance,
        fullName: user.fullName,
        mobile: user.mobile,
        accountStatus: user.accountStatus,
        referralCode: user.referralCode,
      },
    },
  };
}
