import mongoose from 'mongoose';
import { Commission } from '../commissions/model.js';
import { ProjectGroup, hasImage } from '../groups/model.js';
import { groupImageUrl } from '../images/service.js';
import { Project } from '../projects/model.js';
import { offerSequence } from '../projects/service.js';
import { Transaction } from '../wallet/model.js';
import { User } from '../users/model.js';
import { openGroupIds } from '../users/service.js';
import { ensureDailyReset } from '../users/daily.js';
import { orderWorkDate, workDate } from '../../lib/workDate.js';
import { Order, viewOrder } from './model.js';

function cents(value) {
  return Math.round((Number(value) || 0) * 100);
}

export function settleGroupPayment({ walletCents, holdCents, holdGroupId, groupId, priceCents, commissionCents }) {
  if (holdCents > 0 && holdGroupId && groupId && holdGroupId !== groupId) return { error: 'other' };
  const useHold = holdCents > 0 && (!holdGroupId || holdGroupId === groupId);
  const fromHold = useHold ? Math.min(holdCents, priceCents) : 0;
  const fromWallet = priceCents - fromHold;
  if (walletCents < fromWallet) return { error: fromHold > 0 ? 'short' : 'wallet' };
  return {
    walletCents: walletCents - fromWallet,
    holdCents: holdCents - fromHold + priceCents + commissionCents,
    holdGroupId: groupId,
    fromHoldCents: fromHold,
    fromWalletCents: fromWallet,
  };
}

function memberView(user, openIds = []) {
  return {
    id: String(user._id),
    fullName: user.fullName,
    mobile: user.mobile,
    accountStatus: user.accountStatus,
    referralCode: user.referralCode,
    walletBalance: user.walletBalance,
    trialBalance: user.trialBalance || 0,
    holdBalance: user.holdBalance || 0,
    holdGroupId: user.holdGroupId || '',
    pendingCashOut: user.pendingCashOut || 0,
    unlockedGroupIds: openIds,
    hasSecurityPassword: Boolean(user.securityPasswordHash),
    hasWithdrawalPassword: Boolean(user.withdrawalPasswordHash),
  };
}

async function findOrder(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Order.findById(id).select('-image.data');
}

async function withGroups(rows) {
  const missing = rows.filter((order) => !order.groupName && mongoose.isValidObjectId(order.projectId));
  const projects = missing.length
    ? await Project.find({ _id: { $in: missing.map((order) => order.projectId) } })
    : [];
  const projectById = new Map(projects.map((project) => [String(project._id), project]));
  const groupIds = [...new Set(rows.flatMap((order) => {
    const ids = [];
    if (mongoose.isValidObjectId(order.groupId)) ids.push(String(order.groupId));
    const project = projectById.get(String(order.projectId));
    if (project && mongoose.isValidObjectId(project.groupId)) ids.push(String(project.groupId));
    return ids;
  }))];
  const groups = groupIds.length
    ? await ProjectGroup.find({ _id: { $in: groupIds } }).select('name image.contentType')
    : [];
  const groupById = new Map(groups.map((item) => [String(item._id), item]));
  return rows.map((order) => {
    const view = viewOrder(order);
    const project = projectById.get(String(order.projectId));
    const group = groupById.get(String(order.groupId))
      || (project ? groupById.get(String(project.groupId)) : null);
    if (!view.groupName && group) {
      view.groupId = String(group._id);
      view.groupName = group.name;
    }
    if (!view.image && group && hasImage(group)) view.image = groupImageUrl(group._id);
    return view;
  });
}

export async function listOrders({ userId, all }) {
  if (!all && userId) {
    const user = await User.findById(userId);
    if (user && user.role === 'user') await ensureDailyReset(user);
  }
  const filter = all ? {} : { userId: String(userId) };
  const rows = await Order.find(filter).select('-image.data').sort({ createdAt: -1 });
  return { status: 200, data: { orders: await withGroups(rows) } };
}

export async function getOrder({ id, userId, admin }) {
  const order = await findOrder(id);
  if (!order) return { status: 404, message: 'Order not found.' };
  if (!admin && order.userId !== String(userId)) return { status: 404, message: 'Order not found.' };
  const [view] = await withGroups([order]);
  return { status: 200, data: { order: view } };
}

export async function readOrderImage(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  const order = await Order.findById(id).select('image.data image.contentType');
  if (!order || !order.image || !order.image.contentType || !order.image.data || !order.image.data.length) return null;
  return { data: order.image.data, contentType: order.image.contentType };
}

async function ordersForUser(userId, extra = {}) {
  return Order.find({
    userId: String(userId),
    status: { $ne: 'cancelled' },
    ...extra,
  }).select('projectId groupId workDate createdAt startDate');
}

function onWorkDate(rows, date) {
  return rows.filter((row) => orderWorkDate(row) === date);
}

async function trialGroupFinished(userId, groupId, date = workDate()) {
  const projects = await Project.find({ groupId: String(groupId) }).select('_id');
  const ids = projects.map((project) => String(project._id));
  if (!ids.length) return false;
  const done = onWorkDate(await ordersForUser(userId, { projectId: { $in: ids } }), date);
  return new Set(done.map((row) => String(row.projectId))).size >= ids.length;
}

export async function resetCompletedTrialBalances() {
  const group = await ProjectGroup.findOne({ isTrial: true }).select('_id name');
  if (!group) return 0;
  const projects = await Project.find({ groupId: String(group._id) }).select('_id');
  const ids = projects.map((project) => String(project._id));
  if (!ids.length) return 0;
  const users = await User.find({ role: 'user', trialBalance: { $gt: 0 } }).select('trialBalance');
  let cleared = 0;
  for (const user of users) {
    const done = await Order.distinct('projectId', {
      userId: String(user._id),
      projectId: { $in: ids },
      status: { $ne: 'cancelled' },
    });
    if (done.length < ids.length) continue;
    const amount = Number(user.trialBalance) || 0;
    if (amount <= 0) continue;
    user.trialBalance = 0;
    await user.save();
    await Transaction.create({
      userId: String(user._id),
      type: 'trial_reset',
      amount,
      direction: 'debit',
      wallet: 'trial',
      description: `${group.name} completed`,
      status: 'completed',
      referenceId: null,
    });
    cleared += 1;
  }
  return cleared;
}

export async function activateOrder({ userId, projectId }) {
  if (!mongoose.isValidObjectId(userId)) return { status: 401, message: 'Sign in required.' };
  const user = await User.findById(userId);
  if (!user || user.role !== 'user') return { status: 401, message: 'Sign in required.' };
  await ensureDailyReset(user);
  if (user.accountStatus === 'pending') return { status: 403, message: 'Your account is pending admin approval.' };
  if (user.accountStatus === 'blocked') return { status: 403, message: 'This account is blocked.' };
  if (user.accountStatus === 'suspended') return { status: 403, message: 'This account is suspended.' };
  if (!mongoose.isValidObjectId(projectId)) return { status: 404, message: 'This project is not available.' };

  const project = await Project.findById(projectId);
  if (!project) return { status: 404, message: 'This project is not available.' };

  const now = new Date();
  const today = workDate(now);
  const earlier = await ordersForUser(user._id, { projectId: String(project._id) });
  if (onWorkDate(earlier, today).length) {
    return { status: 409, message: 'You have already submitted an order for this project today.' };
  }
  const priceCents = cents(project.price);
  const balanceCents = cents(user.walletBalance);
  const commissionCents = cents(project.commissionAmount);
  const amount = commissionCents / 100;
  const group = await ProjectGroup.findById(project.groupId);
  const groupKey = group ? String(group._id) : String(project.groupId || '');
  const openIds = await openGroupIds(user);
  if (groupKey) {
    const siblings = await Project.find({ groupId: groupKey }).sort({ price: 1, createdAt: 1 });
    const doneOrders = onWorkDate(await ordersForUser(user._id, { groupId: groupKey }), today);
    const done = new Set(doneOrders.map((row) => String(row.projectId)));
    const next = offerSequence(siblings).find((item) => !done.has(String(item._id)));
    if (!next || String(next._id) !== String(project._id)) {
      return { status: 409, message: 'Complete the current project before this one.' };
    }
  }
  if (groupKey && !openIds.includes(groupKey)) {
    const deposit = Number(group && group.unlockDeposit) || 0;
    return {
      status: 403,
      message: deposit > 0
        ? `This group is locked. Deposit AED ${deposit.toFixed(2)} to unlock.`
        : 'This group is locked.',
    };
  }
  const trialOrder = Boolean(group && group.isTrial);
  if (trialOrder && cents(user.trialBalance) < priceCents) {
    return {
      status: 400,
      message: `Insufficient trial balance. This project is AED ${(priceCents / 100).toFixed(2)} and your trial balance is AED ${(cents(user.trialBalance) / 100).toFixed(2)}.`,
    };
  }
  let settlement = null;
  if (!trialOrder) {
    settlement = settleGroupPayment({
      walletCents: balanceCents,
      holdCents: cents(user.holdBalance),
      holdGroupId: String(user.holdGroupId || ''),
      groupId: groupKey,
      priceCents,
      commissionCents,
    });
    if (settlement.error === 'other') {
      return { status: 409, message: 'Finish the group that is on hold before starting another.' };
    }
    if (settlement.error === 'short') {
      return {
        status: 400,
        message: `Insufficient balance. This project is AED ${(priceCents / 100).toFixed(2)}. Hold is AED ${(cents(user.holdBalance) / 100).toFixed(2)} and your wallet is AED ${(balanceCents / 100).toFixed(2)}.`,
      };
    }
    if (settlement.error === 'wallet') {
      return {
        status: 400,
        message: `Insufficient wallet balance. This project is AED ${(priceCents / 100).toFixed(2)} and your wallet balance is AED ${(balanceCents / 100).toFixed(2)}.`,
      };
    }
  }
  const order = await Order.create({
    userId: String(user._id),
    projectId: String(project._id),
    projectName: project.name,
    groupId: group ? String(group._id) : String(project.groupId || ''),
    groupName: group ? group.name : '',
    image: group && group.image && group.image.data
      ? { data: group.image.data, contentType: group.image.contentType }
      : undefined,
    price: priceCents / 100,
    commissionRatio: project.commissionRatio,
    commissionAmount: amount,
    earnedCommission: amount,
    remainingCommission: 0,
    startDate: now,
    endDate: now,
    status: 'completed',
    workDate: today,
  });

  if (trialOrder) {
    user.trialBalance = (cents(user.trialBalance) - priceCents + priceCents) / 100;
    user.walletBalance = (balanceCents + commissionCents) / 100;
    const finished = await trialGroupFinished(user._id, group._id);
    if (finished && cents(user.trialBalance) > 0) {
      const cleared = cents(user.trialBalance) / 100;
      user.trialBalance = 0;
      await Transaction.create({
        userId: String(user._id),
        type: 'trial_reset',
        amount: cleared,
        direction: 'debit',
        wallet: 'trial',
        description: `${group.name} completed`,
        status: 'completed',
        referenceId: String(order._id),
      });
    }
  } else {
    user.walletBalance = settlement.walletCents / 100;
    user.holdBalance = settlement.holdCents / 100;
    user.holdGroupId = settlement.holdGroupId || '';
    const finished = group ? await trialGroupFinished(user._id, group._id) : false;
    if (finished && cents(user.holdBalance) > 0) {
      const released = cents(user.holdBalance) / 100;
      user.walletBalance = (cents(user.walletBalance) + cents(user.holdBalance)) / 100;
      user.holdBalance = 0;
      user.holdGroupId = '';
      settlement.released = released;
    }
  }
  await user.save();

  const purchaseNote = group && group.name ? `${group.name} · ${project.name}` : project.name;
  if (trialOrder && priceCents > 0) {
    await Transaction.create({
      userId: String(user._id),
      type: 'project_purchase',
      amount: priceCents / 100,
      direction: 'debit',
      wallet: 'trial',
      description: purchaseNote,
      status: 'completed',
      referenceId: String(order._id),
    });
  }
  if (!trialOrder && settlement && settlement.fromHoldCents > 0) {
    await Transaction.create({
      userId: String(user._id),
      type: 'project_purchase',
      amount: settlement.fromHoldCents / 100,
      direction: 'debit',
      wallet: 'hold',
      description: purchaseNote,
      status: 'completed',
      referenceId: String(order._id),
    });
  }
  if (!trialOrder && settlement && settlement.fromWalletCents > 0) {
    await Transaction.create({
      userId: String(user._id),
      type: 'project_purchase',
      amount: settlement.fromWalletCents / 100,
      direction: 'debit',
      wallet: 'main',
      description: purchaseNote,
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
    date: today,
    status: 'completed',
  });

  const creditCents = trialOrder ? commissionCents : priceCents + commissionCents;
  await Transaction.create({
    userId: String(user._id),
    type: 'project_commission',
    amount: creditCents / 100,
    direction: 'credit',
    wallet: trialOrder ? 'main' : 'hold',
    description: group && group.name ? `${group.name} · ${project.name}` : project.name,
    status: 'completed',
    referenceId: String(order._id),
  });

  if (!trialOrder && settlement && settlement.released > 0) {
    const groupName = group && group.name ? group.name : 'Group';
    await Transaction.create({
      userId: String(user._id),
      type: 'hold_release',
      amount: settlement.released,
      direction: 'debit',
      wallet: 'hold',
      description: `${groupName} completed`,
      status: 'completed',
      referenceId: String(order._id),
    });
    await Transaction.create({
      userId: String(user._id),
      type: 'hold_release',
      amount: settlement.released,
      direction: 'credit',
      wallet: 'main',
      description: `${groupName} completed`,
      status: 'completed',
      referenceId: String(order._id),
    });
  }

  return { status: 201, data: { order: viewOrder(order), user: memberView(user, await openGroupIds(user)) } };
}
