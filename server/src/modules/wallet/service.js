import mongoose from 'mongoose';
import { User } from '../users/model.js';
import { Transaction, WithdrawalAccount, viewAccount } from './model.js';

function viewTransaction(row) {
  return {
    id: String(row._id),
    userId: row.userId,
    type: row.type,
    amount: row.amount,
    direction: row.direction,
    wallet: row.wallet || 'main',
    description: row.description,
    status: row.status,
    referenceId: row.referenceId || '',
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : '',
  };
}

function snapshot(user) {
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

async function member(userId) {
  if (!mongoose.isValidObjectId(userId)) return null;
  const user = await User.findById(userId);
  if (!user || user.role !== 'user') return null;
  return user;
}

export async function listTransactions(userId) {
  const rows = await Transaction.find({ userId: String(userId) }).sort({ createdAt: -1 });
  return { status: 200, data: { transactions: rows.map(viewTransaction) } };
}

export async function listAllTransactions() {
  const rows = await Transaction.find().sort({ createdAt: -1 }).limit(500);
  const ids = [...new Set(rows.map((row) => row.userId))].filter((id) => mongoose.isValidObjectId(id));
  const users = ids.length ? await User.find({ _id: { $in: ids } }) : [];
  const byId = new Map(users.map((user) => [String(user._id), user]));
  return {
    status: 200,
    data: {
      transactions: rows.map((row) => {
        const owner = byId.get(row.userId);
        return {
          ...viewTransaction(row),
          userName: owner ? owner.fullName : 'Member',
          mobile: owner ? owner.mobile : '',
        };
      }),
    },
  };
}

export async function listAccounts(userId) {
  const rows = await WithdrawalAccount.find({ userId: String(userId) }).sort({ createdAt: -1 });
  return { status: 200, data: { accounts: rows.map(viewAccount) } };
}

export async function addAccount({ userId, body }) {
  const user = await member(userId);
  if (!user) return { status: 401, message: 'Sign in required.' };
  const kind = body.kind === 'bank' ? 'bank' : 'crypto';
  let account;
  if (kind === 'crypto') {
    const network = body.network === 'USDT BEP20' ? 'USDT BEP20' : 'USDT TRC20';
    const address = String(body.address || '').trim();
    if (address.length < 8) return { status: 400, message: 'Enter a wallet address.' };
    account = await WithdrawalAccount.create({ userId: String(user._id), kind, network, address });
  } else {
    const holder = String(body.holder || '').trim();
    const bankName = String(body.bankName || '').trim();
    const iban = String(body.iban || '').trim().replace(/\s+/g, '');
    const accountNumber = String(body.accountNumber || '').trim();
    if (!holder || !bankName) return { status: 400, message: 'Account holder and bank name are required.' };
    if (!iban && !accountNumber) return { status: 400, message: 'Enter an IBAN or account number.' };
    account = await WithdrawalAccount.create({
      userId: String(user._id), kind, holder, bankName, iban, accountNumber,
    });
  }
  return { status: 201, data: { account: viewAccount(account) } };
}

export async function removeAccount({ userId, id }) {
  if (!mongoose.isValidObjectId(id)) return { status: 404, message: 'Account not found.' };
  const row = await WithdrawalAccount.findOne({ _id: id, userId: String(userId) });
  if (!row) return { status: 404, message: 'Account not found.' };
  await row.deleteOne();
  return { status: 200, data: { ok: true } };
}

export async function cashIn({ userId, amount }) {
  const user = await member(userId);
  if (!user) return { status: 401, message: 'Sign in required.' };
  if (user.accountStatus === 'pending') return { status: 403, message: 'Your account is pending admin approval.' };
  if (user.accountStatus === 'blocked') return { status: 403, message: 'This account is blocked.' };
  if (user.accountStatus === 'suspended') return { status: 403, message: 'This account is suspended.' };
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return { status: 400, message: 'Enter an amount greater than 0.' };
  if (value > 10000000) return { status: 400, message: 'Amount is too large.' };
  user.walletBalance += value;
  await user.save();
  const tx = await Transaction.create({
    userId: String(user._id),
    type: 'demo_cash_in',
    amount: value,
    direction: 'credit',
    description: 'USDT TRC20 cash in',
    status: 'completed',
    referenceId: null,
  });
  return { status: 201, data: { user: snapshot(user), transaction: viewTransaction(tx) } };
}

export { snapshot, viewTransaction };
