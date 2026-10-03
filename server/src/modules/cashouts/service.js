import mongoose from 'mongoose';
import { verifyPassword } from '../../lib/password.js';
import { Settings } from '../settings/model.js';
import { User } from '../users/model.js';
import { Transaction } from '../wallet/model.js';
import { WithdrawalAccount } from '../wallet/model.js';
import { Cashout, viewCashout } from './model.js';

function snapshot(user) {
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
    hasSecurityPassword: Boolean(user.securityPasswordHash),
    hasWithdrawalPassword: Boolean(user.withdrawalPasswordHash),
  };
}

function destination(account) {
  if (account.kind === 'crypto') return account.address || '';
  return [account.bankName, account.iban || account.accountNumber].filter(Boolean).join(' · ');
}

export async function requestCashOut({ userId, amount, accountId, securityPassword, withdrawalPassword }) {
  if (!mongoose.isValidObjectId(userId)) return { status: 401, message: 'Sign in required.' };
  const user = await User.findById(userId);
  if (!user || user.role !== 'user') return { status: 401, message: 'Sign in required.' };
  if (user.accountStatus === 'pending') return { status: 403, message: 'Your account is pending admin approval.' };
  if (user.accountStatus === 'blocked') return { status: 403, message: 'This account is blocked.' };
  if (user.accountStatus === 'suspended') return { status: 403, message: 'This account is suspended.' };

  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return { status: 400, message: 'Enter a cash out amount.' };
  const settings = await Settings.findOne({ key: 'platform' });
  const minimum = settings ? settings.minCashOutAmount : 500;
  if (value < minimum) return { status: 400, message: `Minimum cash out is AED ${minimum}.` };
  if (value > user.walletBalance) return { status: 400, message: 'Amount is higher than your available balance.' };
  if (!user.securityPasswordHash || !user.withdrawalPasswordHash) {
    return { status: 400, message: 'Set a security password and a withdrawal password first.' };
  }
  if (!verifyPassword(securityPassword, user.securityPasswordHash)) {
    return { status: 400, message: 'Invalid security password.' };
  }
  if (!verifyPassword(withdrawalPassword, user.withdrawalPasswordHash)) {
    return { status: 400, message: 'Invalid withdrawal password.' };
  }
  if (!mongoose.isValidObjectId(accountId)) return { status: 400, message: 'Select a bound account.' };
  const account = await WithdrawalAccount.findOne({ _id: accountId, userId: String(user._id) });
  if (!account) return { status: 400, message: 'Select a bound account.' };
  const bankOn = !settings || settings.bankPayoutEnabled !== false;
  const cryptoOn = Boolean(settings && settings.cryptoPayoutEnabled === true);
  if (account.kind === 'bank' && !bankOn) return { status: 400, message: 'Bank cash out is turned off.' };
  if (account.kind === 'crypto' && !cryptoOn) return { status: 400, message: 'Crypto cash out is turned off.' };
  const dest = destination(account);
  if (!dest) return { status: 400, message: 'That account is missing details.' };

  const method = account.kind === 'bank' ? 'Bank account' : (account.network || 'Crypto');
  user.walletBalance -= value;
  user.pendingCashOut = (user.pendingCashOut || 0) + value;
  await user.save();

  const cashout = await Cashout.create({
    userId: String(user._id),
    userName: user.fullName,
    mobile: user.mobile,
    amount: value,
    method,
    destination: dest,
    accountId: String(account._id),
    status: 'pending',
    requestedAt: new Date(),
  });
  const tx = await Transaction.create({
    userId: String(user._id),
    type: 'cash_out',
    amount: value,
    direction: 'debit',
    description: `Cash out · ${method}`,
    status: 'pending',
    referenceId: String(cashout._id),
  });
  return { status: 201, data: { cashout: viewCashout(cashout), user: snapshot(user), transaction: {
    id: String(tx._id),
    userId: tx.userId,
    type: tx.type,
    amount: tx.amount,
    direction: tx.direction,
    description: tx.description,
    status: tx.status,
    referenceId: tx.referenceId || '',
    createdAt: tx.createdAt ? new Date(tx.createdAt).toISOString() : '',
  } } };
}

export async function listMine(userId) {
  const rows = await Cashout.find({ userId: String(userId) }).sort({ requestedAt: -1 });
  return { status: 200, data: { cashouts: rows.map(viewCashout) } };
}

export async function listAll({ status }) {
  const filter = {};
  if (status && status !== 'all') filter.status = status;
  const rows = await Cashout.find(filter).sort({ requestedAt: -1 });
  return { status: 200, data: { cashouts: rows.map(viewCashout) } };
}

export async function setCashoutStatus({ id, status, rejectionReason }) {
  if (!mongoose.isValidObjectId(id)) return { status: 404, message: 'Request not found.' };
  const req = await Cashout.findById(id);
  if (!req) return { status: 404, message: 'Request not found.' };
  if (req.status !== 'pending' && req.status !== 'processing') {
    return { status: 400, message: 'This request is already closed.' };
  }
  const user = await User.findById(req.userId);
  const tx = await Transaction.findOne({ referenceId: String(req._id), type: 'cash_out' });
  req.processedAt = new Date();
  if (status === 'completed') {
    req.status = 'completed';
    if (user) user.pendingCashOut = Math.max(0, (user.pendingCashOut || 0) - req.amount);
    if (tx) tx.status = 'completed';
  } else if (status === 'rejected') {
    const reason = String(rejectionReason || '').trim();
    if (!reason) return { status: 400, message: 'A rejection reason is required.' };
    req.status = 'rejected';
    req.rejectionReason = reason;
    if (user) {
      user.pendingCashOut = Math.max(0, (user.pendingCashOut || 0) - req.amount);
      user.walletBalance += req.amount;
    }
    if (tx) tx.status = 'failed';
    await Transaction.create({
      userId: req.userId,
      type: 'refund',
      amount: req.amount,
      direction: 'credit',
      description: `Cash out rejected · ${reason}`,
      status: 'completed',
      referenceId: String(req._id),
    });
  } else if (status === 'processing') {
    req.status = 'processing';
  } else {
    return { status: 400, message: 'Choose a valid status.' };
  }
  await req.save();
  if (user) await user.save();
  if (tx) await tx.save();
  return { status: 200, data: { cashout: viewCashout(req) } };
}
