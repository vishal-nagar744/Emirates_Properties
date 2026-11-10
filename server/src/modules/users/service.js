import mongoose from 'mongoose';
import { normalizeCurrency } from '../../lib/currency.js';
import { hashPassword } from '../../lib/password.js';
import { AnnouncementReceipt } from '../announcements/model.js';
import { Session } from '../auth/model.js';
import { revokeUserSessions } from '../auth/session.js';
import { Cashout } from '../cashouts/model.js';
import { Commission } from '../commissions/model.js';
import { ProjectGroup } from '../groups/model.js';
import { User } from './model.js';
import { Transaction, WithdrawalAccount } from '../wallet/model.js';
import { Order } from '../orders/model.js';
import { Project } from '../projects/model.js';
import { itemId, nextAccessibleProject, setSequence, setNumberOf } from '../projects/service.js';
import { Referral } from '../referrals/model.js';
import { UserPremium } from './premium-model.js';
import { groupCycleStarts, orderWorkDate } from '../../lib/workDate.js';
import { ensureDailyReset } from './daily.js';
import { nextMemberNo } from './memberNo.js';
import { applyIncomingCredit } from './premium-fund.js';

function digits(value) {
  return String(value || '').replace(/\D/g, '');
}

export function setKey(groupId, setNumber) {
  const n = Number(setNumber) === 2 || Number(setNumber) === 3 ? Number(setNumber) : 1;
  return `${String(groupId)}:${n}`;
}

export function isSetOpen(user, groupId, setNumber) {
  const n = Number(setNumber) === 2 || Number(setNumber) === 3 ? Number(setNumber) : 1;
  if (!user || !groupId) return n === 1;
  if (!user.setAccessSet) return n === 1;
  return (user.unlockedSetKeys || []).map(String).includes(setKey(groupId, n));
}

export function openSetKeys(user) {
  if (!user) return [];
  if (user.setAccessSet) return (user.unlockedSetKeys || []).map(String);
  return [];
}

function noticeList(user) {
  return Array.isArray(user.unlockNotices) ? user.unlockNotices.slice() : [];
}

function pushUnlockNotice(user, notice) {
  const list = noticeList(user);
  list.push({
    id: new mongoose.Types.ObjectId().toString(),
    kind: notice.kind,
    groupId: notice.groupId || '',
    groupName: notice.groupName || '',
    setNumber: notice.setNumber || null,
    createdAt: new Date().toISOString(),
  });
  user.unlockNotices = list.slice(-20);
}

export function creditScoreValue(user) {
  const value = Number(user && user.creditScore);
  if (!Number.isFinite(value)) return 50;
  return Math.min(100, Math.max(1, Math.round(value)));
}

function viewUser(user, extra = {}) {
  return {
    id: String(user._id),
    memberNo: user.memberNo || null,
    fullName: user.fullName,
    mobile: user.mobile,
    loginId: user.loginId || '',
    role: user.role,
    currency: normalizeCurrency(user.currency),
    accountStatus: user.accountStatus,
    creditScore: creditScoreValue(user),
    walletBalance: user.walletBalance,
    trialBalance: user.trialBalance || 0,
    holdBalance: user.holdBalance || 0,
    holdGroupId: user.holdGroupId || '',
    pendingCashOut: user.pendingCashOut,
    unlockedGroupIds: [],
    setAccessSet: Boolean(user.setAccessSet),
    unlockedSetKeys: openSetKeys(user),
    unlockNotices: noticeList(user),
    hasWithdrawalPassword: Boolean(user.withdrawalPasswordHash),
    progressCycleStart: user.progressCycleStart || '',
    progressCycleDone: Boolean(user.progressCycleDone),
    groupCycleStarts: groupCycleStarts(user),
    restartGroupIds: Array.isArray(user.restartGroupIds) ? user.restartGroupIds.map(String) : [],
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

function resolvedOpenGroupIds(user, trialId) {
  if (!user || user.role === 'admin') return [];
  if (user.groupAccessSet) return (user.unlockedGroupIds || []).map(String);
  if (!trialId) return [];
  if ((user.lockedGroupIds || []).map(String).includes(trialId)) return [];
  return [trialId];
}

export async function openGroupIds(user) {
  if (!user || user.role === 'admin') return [];
  if (user.groupAccessSet) return (user.unlockedGroupIds || []).map(String);
  const trial = await ProjectGroup.findOne({ isTrial: true }).select('_id');
  return resolvedOpenGroupIds(user, trial ? String(trial._id) : '');
}

async function decorate(users) {
  const needsTrial = users.some((user) => user && user.role !== 'admin' && !user.groupAccessSet);
  const trial = needsTrial ? await ProjectGroup.findOne({ isTrial: true }).select('_id') : null;
  const trialId = trial ? String(trial._id) : '';
  return users.map((user) => viewUser(user, {
    unlockedGroupIds: resolvedOpenGroupIds(user, trialId),
  }));
}

export async function listMembers({ status, q }) {
  const filter = { role: 'user' };
  if (status && status !== 'all') filter.accountStatus = status;
  let rows = await User.find(filter)
    .select('-passwordHash -withdrawalPasswordHash')
    .sort({ createdAt: -1 })
    .lean();
  const query = String(q || '').trim().toLowerCase();
  if (query) {
    rows = rows.filter((user) => `${user.fullName} ${user.mobile} ${user.memberNo || ''}`.toLowerCase().includes(query));
  }
  return { status: 200, data: { users: await decorate(rows) } };
}

export async function getMember(id) {
  const user = await findMember(id);
  if (!user) return { status: 404, message: 'User not found.' };
  await ensureDailyReset(user);
  const [view] = await decorate([user]);
  return { status: 200, data: { user: view } };
}

export async function setOwnCurrency(session, currency) {
  if (!session || session.role !== 'user') return { status: 401, message: 'Sign in required.' };
  if (!mongoose.isValidObjectId(session.subjectId)) return { status: 401, message: 'Sign in required.' };
  const user = await User.findById(session.subjectId);
  if (!user || user.role !== 'user') return { status: 401, message: 'Sign in required.' };
  user.currency = normalizeCurrency(currency);
  await user.save();
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

export async function setMemberCreditScore(id, creditScore) {
  const value = Number(creditScore);
  if (!Number.isInteger(value) || value < 1 || value > 100) {
    return { status: 400, message: 'Credit score must be a whole number between 1 and 100.' };
  }
  const user = await findMember(id);
  if (!user) return { status: 404, message: 'User not found.' };
  user.creditScore = value;
  await user.save();
  const [view] = await decorate([user]);
  return { status: 200, data: { user: view } };
}

export async function setMemberPasswords(id, { loginPassword, withdrawalPassword }) {
  const user = await findMember(id);
  if (!user) return { status: 404, message: 'User not found.' };
  const loginNext = String(loginPassword || '');
  const withdrawNext = String(withdrawalPassword || '');
  if (!loginNext && !withdrawNext) {
    return { status: 400, message: 'Enter a login password or a withdrawal password.' };
  }
  if (loginNext && loginNext.length < 6) {
    return { status: 400, message: 'Login password must be at least 6 characters.' };
  }
  if (withdrawNext && withdrawNext.length < 6) {
    return { status: 400, message: 'Withdrawal password must be at least 6 characters.' };
  }
  if (loginNext) user.passwordHash = hashPassword(loginNext);
  if (withdrawNext) user.withdrawalPasswordHash = hashPassword(withdrawNext);
  await user.save();
  if (loginNext) await revokeUserSessions(String(user._id));
  const [view] = await decorate([user]);
  const parts = [];
  if (loginNext) parts.push('login password');
  if (withdrawNext) parts.push('withdrawal password');
  return {
    status: 200,
    data: {
      message: `${parts.join(' and ')} updated.`,
      user: view,
    },
  };
}

export async function deleteMember(id) {
  const user = await findMember(id);
  if (!user) return { status: 404, message: 'User not found.' };
  const userId = String(user._id);
  await Promise.all([
    Session.deleteMany({ subjectId: userId }),
    Transaction.deleteMany({ userId }),
    WithdrawalAccount.deleteMany({ userId }),
    Cashout.deleteMany({ userId }),
    Order.deleteMany({ userId }),
    Commission.deleteMany({ userId }),
    UserPremium.deleteMany({ userId }),
    AnnouncementReceipt.deleteMany({ userId }),
    Referral.deleteMany({
      $or: [{ referrerUserId: userId }, { referredUserId: userId }],
    }),
  ]);
  await User.deleteOne({ _id: user._id, role: 'user' });
  return { status: 200, data: { ok: true, id: userId } };
}

export async function adjustMemberWallet(id, { amount, reason }) {
  const value = Number(amount);
  const note = String(reason || '').trim() || 'Admin adjustment';
  if (!Number.isFinite(value) || value === 0) return { status: 400, message: 'Enter an amount other than zero.' };
  const user = await findMember(id);
  if (!user) return { status: 404, message: 'User not found.' };
  if (value > 0) {
    const credit = await applyIncomingCredit(user, value, { type: 'adjustment', description: note });
    const [view] = await decorate([user]);
    return { status: 200, data: { user: view, credit } };
  }
  const next = Math.round(((Number(user.walletBalance) || 0) + value) * 100) / 100;
  if (next < 0) return { status: 400, message: 'Wallet cannot go below zero.' };
  user.walletBalance = next;
  await user.save();
  await Transaction.create({
    userId: String(user._id),
    type: 'adjustment',
    amount: Math.abs(value),
    direction: 'debit',
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
  const found = ids.length ? await ProjectGroup.find({ _id: { $in: ids } }).select('_id name') : [];
  if (found.length !== ids.length) return { status: 400, message: 'Choose a valid group.' };
  const previous = new Set(await openGroupIds(user));
  const nextIds = found.map((group) => String(group._id));
  const names = new Map(found.map((group) => [String(group._id), group.name]));
  user.groupAccessSet = true;
  user.unlockedGroupIds = nextIds;
  user.lockedGroupIds = [];
  nextIds.forEach((groupId) => {
    if (!previous.has(groupId)) {
      pushUnlockNotice(user, { kind: 'group', groupId, groupName: names.get(groupId) || 'Group' });
    }
  });
  await user.save();
  const [view] = await decorate([user]);
  return { status: 200, data: { user: view } };
}

export async function setMemberSets(id, setKeys) {
  const user = await findMember(id);
  if (!user) return { status: 404, message: 'User not found.' };
  await ensureDailyReset(user);
  if (!Array.isArray(setKeys)) return { status: 400, message: 'Choose the open sets.' };
  const keys = [...new Set(setKeys.map(String))];
  const parsed = [];
  for (const key of keys) {
    const [groupId, rawSet] = String(key).split(':');
    const setNumber = Number(rawSet) === 2 || Number(rawSet) === 3 ? Number(rawSet) : Number(rawSet) === 1 ? 1 : 0;
    if (!mongoose.isValidObjectId(groupId) || !setNumber) {
      return { status: 400, message: 'Choose a valid set.' };
    }
    parsed.push({ groupId, setNumber, key: setKey(groupId, setNumber) });
  }
  const groupIds = [...new Set(parsed.map((row) => row.groupId))];
  const found = groupIds.length ? await ProjectGroup.find({ _id: { $in: groupIds } }).select('_id name') : [];
  if (found.length !== groupIds.length) return { status: 400, message: 'Choose a valid set.' };
  const names = new Map(found.map((group) => [String(group._id), group.name]));
  const previous = new Set();
  for (const group of found) {
    for (const setNumber of [1, 2, 3]) {
      if (isSetOpen(user, String(group._id), setNumber)) previous.add(setKey(group._id, setNumber));
    }
  }
  const nextKeys = parsed.map((row) => row.key);
  user.setAccessSet = true;
  user.unlockedSetKeys = nextKeys;
  nextKeys.forEach((key) => {
    if (previous.has(key)) return;
    const [groupId, rawSet] = key.split(':');
    pushUnlockNotice(user, {
      kind: 'set',
      groupId,
      groupName: names.get(groupId) || 'Group',
      setNumber: Number(rawSet) || 1,
    });
  });
  await user.save();
  const [view] = await decorate([user]);
  return { status: 200, data: { user: view } };
}

export async function clearUnlockNotices(session) {
  if (!session || session.role !== 'user') return { status: 401, message: 'Sign in required.' };
  const user = await findMember(session.subjectId);
  if (!user) return { status: 401, message: 'Sign in required.' };
  user.unlockNotices = [];
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
    groupIds.length ? Project.find({ groupId: { $in: groupIds } }).select('name price commissionAmount projectType setNumber groupId createdAt') : [],
    groupIds.length ? UserPremium.find({ userId: String(user._id), groupId: { $in: groupIds } }) : [],
  ]);
  const groupName = new Map(groupRows.map((group) => [String(group._id), group.name]));
  const projectById = new Map(projectRows.map((project) => [String(project._id), project]));
  const premiumById = new Map(premiumRows.map((premium) => [String(premium._id), premium]));
  const projectsByGroup = new Map();
  projectRows.forEach((project) => {
    const key = String(project.groupId);
    const list = projectsByGroup.get(key) || [];
    list.push(project);
    projectsByGroup.set(key, list);
  });
  const premiumsByGroup = new Map();
  premiumRows.forEach((premium) => {
    const key = String(premium.groupId);
    const list = premiumsByGroup.get(key) || [];
    list.push(premium);
    premiumsByGroup.set(key, list);
  });

  const doneByGroup = new Map();
  orders.forEach((order) => {
    const key = order.groupId || 'none';
    const done = doneByGroup.get(key) || new Set();
    done.add(String(order.projectId));
    doneByGroup.set(key, done);
  });

  const itemDetails = (id) => {
    const premium = premiumById.get(String(id));
    if (premium) {
      const kind = premium.kind === 'fortune' ? 'fortune' : 'premium';
      const reward = kind === 'fortune' && premium.reward === 'cash' ? 'cash' : 'project';
      return {
        projectType: reward === 'cash' ? 'fortune' : 'premium',
        kind,
        reward,
        position: Number(premium.position) || 1,
        setNumber: setNumberOf(premium),
      };
    }
    const project = projectById.get(String(id));
    if (project) {
      return {
        projectType: 'normal',
        kind: 'normal',
        reward: 'project',
        position: 0,
        setNumber: setNumberOf(project),
      };
    }
    return { projectType: 'normal', kind: 'normal', reward: 'project', position: 0, setNumber: 1 };
  };

  const orderView = (order) => ({
    id: String(order._id),
    projectName: order.projectName,
    price: Number(order.price) || 0,
    commissionAmount: Number(order.commissionAmount) || Number(order.earnedCommission) || 0,
    createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : '',
    ...itemDetails(order.projectId),
  });

  const currentView = (item, groupId) => {
    const details = itemDetails(itemId(item));
    return {
      id: itemId(item),
      name: item.name,
      price: Number(item.price) || 0,
      commissionAmount: Number(item.commissionAmount) || 0,
      ...details,
      locked: !isSetOpen(user, groupId, details.setNumber),
    };
  };

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
        const premiums = premiumsByGroup.get(groupId) || [];
        const allDone = doneByGroup.get(groupId) || new Set();
        const currentItem = nextAccessibleProject(projects, premiums, allDone).item;
        const current = currentItem ? currentView(currentItem, groupId) : null;
        const dayOrders = rows.map(orderView);
        const daySpent = dayOrders.reduce((sum, order) => sum + order.price, 0);
        const dayCommission = dayOrders.reduce((sum, order) => sum + order.commissionAmount, 0);
        let total = 0;
        const sets = [1, 2, 3].map((setNumber) => {
          const sequence = setSequence(
            projects.filter((project) => setNumberOf(project) === setNumber),
            premiums.filter((premium) => setNumberOf(premium) === setNumber),
          );
          const completed = sequence.filter((item) => allDone.has(itemId(item))).length;
          const setOrders = dayOrders.filter((order) => order.setNumber === setNumber);
          total += sequence.length;
          return {
            setNumber,
            total: Math.max(sequence.length, completed),
            completed,
            locked: !isSetOpen(user, groupId, setNumber),
            current: Boolean(current && current.setNumber === setNumber),
            orders: setOrders,
          };
        }).filter((set) => set.total > 0 || set.orders.length || set.current);
        const completed = sets.reduce((sum, set) => sum + set.completed, 0);
        const overallTotal = Math.max(total, completed);
        return {
          groupId,
          groupName: groupName.get(groupId) || rows[0].groupName || 'Group',
          completed,
          total: overallTotal,
          finished: !current && overallTotal > 0 && completed >= overallTotal,
          stoppedAt: current ? current.name : '',
          spent: Math.round(daySpent * 100) / 100,
          commission: Math.round(dayCommission * 100) / 100,
          current,
          sets,
          orders: dayOrders,
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
  const [view] = await decorate([user]);
  return { status: 200, data: { user: view } };
}
