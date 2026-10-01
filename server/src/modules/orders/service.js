import mongoose from 'mongoose';
import { Commission } from '../commissions/model.js';
import { ProjectGroup } from '../groups/model.js';
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

function cents(value) {
  return Math.round((Number(value) || 0) * 100);
}

function memberView(user) {
  return {
    id: String(user._id),
    fullName: user.fullName,
    mobile: user.mobile,
    accountStatus: user.accountStatus,
    referralCode: user.referralCode,
    walletBalance: user.walletBalance,
    trialBalance: user.trialBalance || 0,
    pendingCashOut: user.pendingCashOut || 0,
    hasSecurityPassword: Boolean(user.securityPasswordHash),
    hasWithdrawalPassword: Boolean(user.withdrawalPasswordHash),
  };
}

async function findOrder(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Order.findById(id);
}

async function withGroups(rows) {
  const missing = rows.filter((order) => !order.groupName && mongoose.isValidObjectId(order.projectId));
  const projects = missing.length
    ? await Project.find({ _id: { $in: missing.map((order) => order.projectId) } })
    : [];
  const groupIds = [...new Set(projects.map((project) => project.groupId).filter((id) => mongoose.isValidObjectId(id)))];
  const groups = groupIds.length ? await ProjectGroup.find({ _id: { $in: groupIds } }) : [];
  const projectById = new Map(projects.map((project) => [String(project._id), project]));
  const groupById = new Map(groups.map((item) => [String(item._id), item]));
  return rows.map((order) => {
    const view = viewOrder(order);
    if (!view.groupName) {
      const project = projectById.get(String(order.projectId));
      const group = project ? groupById.get(String(project.groupId)) : null;
      view.groupId = project ? String(project.groupId || '') : '';
      view.groupName = group ? group.name : '';
    }
    return view;
  });
}

export async function listOrders({ userId, all }) {
  const filter = all ? {} : { userId: String(userId) };
  const rows = await Order.find(filter).sort({ createdAt: -1 });
  return { status: 200, data: { orders: await withGroups(rows) } };
}

export async function getOrder({ id, userId, admin }) {
  const order = await findOrder(id);
  if (!order) return { status: 404, message: 'Order not found.' };
  if (!admin && order.userId !== String(userId)) return { status: 404, message: 'Order not found.' };
  const [view] = await withGroups([order]);
  return { status: 200, data: { order: view } };
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
  if (!project) return { status: 404, message: 'This project is not available.' };

  const already = await Order.findOne({
    userId: String(user._id),
    projectId: String(project._id),
    status: { $ne: 'cancelled' },
  });
  if (already) return { status: 409, message: 'You have already submitted an order for this project.' };

  const now = new Date();
  const priceCents = cents(project.price);
  const balanceCents = cents(user.walletBalance);
  const commissionCents = cents(project.commissionAmount);
  const amount = commissionCents / 100;
  const group = await ProjectGroup.findById(project.groupId);
  const trialOrder = Boolean(group && group.isTrial);
  if (trialOrder && cents(user.trialBalance) < priceCents) {
    return {
      status: 400,
      message: `Insufficient trial balance. This project is AED ${(priceCents / 100).toFixed(2)} and your trial balance is AED ${(cents(user.trialBalance) / 100).toFixed(2)}.`,
    };
  }
  if (!trialOrder && balanceCents < priceCents) {
    return {
      status: 400,
      message: `Insufficient wallet balance. This project is AED ${(priceCents / 100).toFixed(2)} and your wallet balance is AED ${(balanceCents / 100).toFixed(2)}.`,
    };
  }
  const order = await Order.create({
    userId: String(user._id),
    projectId: String(project._id),
    projectName: project.name,
    groupId: group ? String(group._id) : String(project.groupId || ''),
    groupName: group ? group.name : '',
    image: '',
    price: priceCents / 100,
    commissionRatio: project.commissionRatio,
    commissionAmount: amount,
    earnedCommission: amount,
    remainingCommission: 0,
    startDate: now,
    endDate: now,
    status: 'completed',
  });

  if (trialOrder) {
    user.trialBalance = (cents(user.trialBalance) - priceCents + priceCents) / 100;
    user.walletBalance = (balanceCents + commissionCents) / 100;
  } else {
    const returnCents = priceCents + commissionCents;
    user.walletBalance = (balanceCents - priceCents + returnCents) / 100;
  }
  await user.save();

  if (priceCents > 0) {
    await Transaction.create({
      userId: String(user._id),
      type: 'project_purchase',
      amount: priceCents / 100,
      direction: 'debit',
      wallet: trialOrder ? 'trial' : 'main',
      description: group && group.name ? `${group.name} · ${project.name}` : project.name,
      status: 'completed',
      referenceId: String(order._id),
    });
  }

  if (trialOrder && priceCents > 0) {
    await Transaction.create({
      userId: String(user._id),
      type: 'project_purchase',
      amount: priceCents / 100,
      direction: 'credit',
      wallet: 'trial',
      description: group && group.name ? `${group.name} · ${project.name}` : project.name,
      status: 'completed',
      referenceId: String(order._id),
    });
  }

  await Commission.create({
    userId: String(user._id),
    orderId: String(order._id),
    projectId: String(project._id),
    projectName: project.name,
    groupName: group ? group.name : '',
    amount,
    dayIndex: 1,
    date: dayKey(now),
    status: 'completed',
  });

  const creditCents = trialOrder ? commissionCents : priceCents + commissionCents;
  await Transaction.create({
    userId: String(user._id),
    type: 'project_commission',
    amount: creditCents / 100,
    direction: 'credit',
    wallet: 'main',
    description: group && group.name ? `${group.name} · ${project.name}` : project.name,
    status: 'completed',
    referenceId: String(order._id),
  });

  return { status: 201, data: { order: viewOrder(order), user: memberView(user) } };
}
