import mongoose from 'mongoose';
import { revokeUserSessions } from '../auth/session.js';
import { User } from './model.js';
import { Transaction } from '../wallet/model.js';

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
    pendingCashOut: user.pendingCashOut,
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

async function decorate(users) {
  const ids = users.map((user) => String(user._id));
  const referrers = await User.find({ _id: { $in: users.map((user) => user.referredBy).filter(Boolean) } });
  const referrerName = new Map(referrers.map((user) => [String(user._id), user.fullName]));
  const referred = await User.find({ role: 'user', referredBy: { $in: ids } });
  const counts = new Map();
  referred.forEach((user) => {
    counts.set(user.referredBy, (counts.get(user.referredBy) || 0) + 1);
  });
  return users.map((user) => viewUser(user, {
    referredByName: user.referredBy ? (referrerName.get(user.referredBy) || '') : '',
    referralCount: counts.get(String(user._id)) || 0,
  }));
}

export async function listMembers({ status, q }) {
  const filter = { role: 'user' };
  if (status && status !== 'all') filter.accountStatus = status;
  let rows = await User.find(filter).sort({ createdAt: -1 });
  const query = String(q || '').trim().toLowerCase();
  if (query) {
    rows = rows.filter((user) => `${user.fullName} ${user.mobile} ${user.referralCode}`.toLowerCase().includes(query));
  }
  return { status: 200, data: { users: await decorate(rows) } };
}

export async function getMember(id) {
  const user = await findMember(id);
  if (!user) return { status: 404, message: 'User not found.' };
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
