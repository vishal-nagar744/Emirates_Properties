import mongoose from 'mongoose';
import { revokeUserSessions } from '../auth/session.js';
import { ProjectGroup } from '../groups/model.js';
import { User } from './model.js';
import { Transaction } from '../wallet/model.js';
import { Order } from '../orders/model.js';
import { Project } from '../projects/model.js';
import { nextGroupProject } from '../projects/service.js';
import { UserPremium } from './premium-model.js';
import { orderWorkDate } from '../../lib/workDate.js';
import { ensureDailyReset } from './daily.js';

function digits(value) {
  return String(value || '').replace(/\D/g, '');
}

function viewUser(user, extra = {}) {
  return {
    id: String(user._id),
    fullName: user.fullName,
    mobile: user.mobile,
    loginId: user.loginId || '',
    role: user.role,
    referralCode: user.referralCode,
    referredBy: user.referredBy || null,
    accountStatus: user.accountStatus,
    walletBalance: user.walletBalance,
    trialBalance: user.trialBalance || 0,
    holdBalance: user.holdBalance || 0,
    holdGroupId: user.holdGroupId || '',
    pendingCashOut: user.pendingCashOut,
    unlockedGroupIds: [],
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : '',
    ...extra,
  };
}

async function findMember(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  const user = await User.findById(id);
  if (!user || user.role !== 'user') return null;
  return user;
}

export async function openGroupIds(user) {
  if (!user || user.role === 'admin') return [];
  if (user.groupAccessSet) return (user.unlockedGroupIds || []).map(String);
  const trial = await ProjectGroup.findOne({ isTrial: true }).select('_id');
  if (!trial) return [];
  const id = String(trial._id);
  if ((user.lockedGroupIds || []).map(String).includes(id)) return [];
  return [id];
}

async function decorate(users) {
  const ids = users.map((user) => String(user._id));
  const referrers = await User.find({ _id: { $in: users.map((user) => user.referredBy).filter(Boolean) } });
  const referrerName = new Map(referrers.map((user) => [String(user._id), user.fullName]));
  const referred = await User.find({ role: 'user', referredBy: { $in: ids } });
  const counts = new Map();
  referred.forEach((user) => {
    counts.set(user.referredBy, (counts.get(user.referredBy) || 0) + 1);
  });
  const views = [];
  for (const user of users) {
    views.push(viewUser(user, {
      referredByName: user.referredBy ? (referrerName.get(user.referredBy) || '') : '',
      referralCount: counts.get(String(user._id)) || 0,
      unlockedGroupIds: await openGroupIds(user),
    }));
  }
  return views;
}

export async function listMembers({ status, q }) {
  const filter = { role: 'user' };
  if (status && status !== 'all') filter.accountStatus = status;
  let rows = await User.find(filter).sort({ createdAt: -1 });
  const query = String(q || '').trim().toLowerCase();
  if (query) {
    rows = rows.filter((user) => `${user.fullName} ${user.mobile} ${user.referralCode}`.toLowerCase().includes(query));
  }
  for (const user of rows) await ensureDailyReset(user);
  return { status: 200, data: { users: await decorate(rows) } };
}

export async function getMember(id) {
  const user = await findMember(id);
  if (!user) return { status: 404, message: 'User not found.' };
  await ensureDailyReset(user);
  const [view] = await decorate([user]);
  return { status: 200, data: { user: view } };
}

export async function setMemberStatus(id, accountStatus) {
  if (!['active', 'pending', 'blocked', 'suspended'].includes(accountStatus)) {
    return { status: 400, message: 'Status must be active, pending, blocked, or suspended.' };
  }
  const user = await findMember(id);
  if (!user) return { status: 404, message: 'User not found.' };
  user.accountStatus = accountStatus;
  await user.save();
  if (accountStatus === 'blocked' || accountStatus === 'suspended') {
    await revokeUserSessions(String(user._id));
  }
  const [view] = await decorate([user]);
  return { status: 200, data: { user: view } };
}

export async function adjustMemberWallet(id, { amount, reason }) {
  const value = Number(amount);
  const note = String(reason || '').trim();
  if (!Number.isFinite(value) || value === 0) return { status: 400, message: 'Enter an amount other than zero.' };
  if (!note) return { status: 400, message: 'Enter a reason.' };
  const user = await findMember(id);
  if (!user) return { status: 404, message: 'User not found.' };
  const next = user.walletBalance + value;
  if (next < 0) return { status: 400, message: 'Balance cannot go below zero.' };
  user.walletBalance = next;
  await user.save();
  await Transaction.create({
    userId: String(user._id),
    type: 'adjustment',
    amount: Math.abs(value),
    direction: value > 0 ? 'credit' : 'debit',
    description: note,
    status: 'completed',
    referenceId: null,
  });
  const [view] = await decorate([user]);
  return { status: 200, data: { user: view } };
}

export async function setMemberGroups(id, groupIds) {
  const user = await findMember(id);
  if (!user) return { status: 404, message: 'User not found.' };
  await ensureDailyReset(user);
  if (!Array.isArray(groupIds)) return { status: 400, message: 'Choose the open groups.' };
  const ids = [...new Set(groupIds.map(String))];
  if (ids.some((groupId) => !mongoose.isValidObjectId(groupId))) {
    return { status: 400, message: 'Choose a valid group.' };
  }
  const found = ids.length ? await ProjectGroup.find({ _id: { $in: ids } }).select('_id') : [];
  if (found.length !== ids.length) return { status: 400, message: 'Choose a valid group.' };
  user.groupAccessSet = true;
  user.unlockedGroupIds = found.map((group) => String(group._id));
  user.lockedGroupIds = [];
  await user.save();
  const [view] = await decorate([user]);
  return { status: 200, data: { user: view } };
}

export async function memberDailyHistory(id) {
  const user = await findMember(id);
  if (!user) return { status: 404, message: 'User not found.' };
  const orders = await Order.find({ userId: String(user._id), status: { $ne: 'cancelled' } })
    .select('-image.data')
    .sort({ createdAt: 1 });
  const groupIds = [...new Set(orders.map((order) => order.groupId).filter(Boolean))];
  const [groupRows, projectRows, premiumRows] = await Promise.all([
    groupIds.length ? ProjectGroup.find({ _id: { $in: groupIds } }).select('name') : [],
    groupIds.length ? Project.find({ groupId: { $in: groupIds } }).select('name price projectType setNumber groupId createdAt') : [],
    groupIds.length ? UserPremium.find({ userId: String(user._id), groupId: { $in: groupIds } }) : [],
  ]);
  const groupName = new Map(groupRows.map((group) => [String(group._id), group.name]));
  const projectsByGroup = new Map();
  projectRows.forEach((project) => {
    const key = String(project.groupId);
    const list = projectsByGroup.get(key) || [];
    list.push(project);
    projectsByGroup.set(key, list);
  });

  const byDay = new Map();
  orders.forEach((order) => {
    const date = orderWorkDate(order) || 'Unknown';
    const day = byDay.get(date) || new Map();
    const key = order.groupId || 'none';
    const list = day.get(key) || [];
    list.push(order);
    day.set(key, list);
    byDay.set(date, day);
  });

  const days = [...byDay.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, groups]) => ({
      date,
      groups: [...groups.entries()].map(([groupId, rows]) => {
        const projects = projectsByGroup.get(groupId) || [];
        const premiums = premiumRows.filter((row) => String(row.groupId) === groupId);
        const done = new Set(rows.map((order) => String(order.projectId)));
        const next = nextGroupProject(projects, premiums, done);
        const total = projects.length + premiums.length;
        const commission = rows.reduce((sum, order) => sum + (Number(order.commissionAmount) || Number(order.earnedCommission) || 0), 0);
        const spent = rows.reduce((sum, order) => sum + (Number(order.price) || 0), 0);
        return {
          groupId,
          groupName: groupName.get(groupId) || rows[0].groupName || 'Group',
          completed: done.size,
          total: total || done.size,
          finished: !next && total > 0 && done.size >= total,
          stoppedAt: next ? next.name : '',
          spent: Math.round(spent * 100) / 100,
          commission: Math.round(commission * 100) / 100,
          orders: rows.map((order) => ({
            id: String(order._id),
            projectName: order.projectName,
            price: Number(order.price) || 0,
            commissionAmount: Number(order.commissionAmount) || Number(order.earnedCommission) || 0,
            createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : '',
          })),
        };
      }),
    }));

  return { status: 200, data: { days } };
}

export async function updateOwnProfile(session, { fullName, mobile }) {
  if (!session || session.role !== 'user') return { status: 401, message: 'Sign in required.' };
  if (!mongoose.isValidObjectId(session.subjectId)) return { status: 401, message: 'Sign in required.' };
  const user = await User.findById(session.subjectId);
  if (!user || user.role !== 'user') return { status: 401, message: 'Sign in required.' };

  const name = String(fullName || '').trim();
  const phone = String(mobile || '').trim();
  if (!name) return { status: 400, message: 'Enter your full name.' };
  if (digits(phone).length < 8) return { status: 400, message: 'Enter a valid mobile number.' };

  const taken = await User.findOne({ mobileDigits: digits(phone), _id: { $ne: user._id } });
  if (taken) return { status: 409, message: 'This mobile number is already registered.' };

  user.fullName = name;
  user.mobile = phone;
  user.mobileDigits = digits(phone);
  try {
    await user.save();
  } catch (err) {
    if (err && err.code === 11000) return { status: 409, message: 'This mobile number is already registered.' };
    throw err;
  }
  return { status: 200, data: { user: viewUser(user) } };
}
