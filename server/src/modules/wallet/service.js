import mongoose from 'mongoose';
import { normalizeCurrency } from '../../lib/currency.js';
import { User } from '../users/model.js';
import { Settings } from '../settings/model.js';
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
    currency: normalizeCurrency(user.currency),
    accountStatus: user.accountStatus,
    walletBalance: user.walletBalance,
    trialBalance: user.trialBalance || 0,
    holdBalance: user.holdBalance || 0,
    holdGroupId: user.holdGroupId || '',
    pendingCashOut: user.pendingCashOut || 0,
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
          memberNo: owner && owner.memberNo != null ? owner.memberNo : null,
        };
      }),
    },
  };
}

export async function listAccounts(userId) {
  const rows = await WithdrawalAccount.find({ userId: String(userId) }).sort({ createdAt: -1 });
  return { status: 200, data: { accounts: rows.map(viewAccount) } };
}

function normalizedAccount(kind, body, { mobileRequired = true } = {}) {
  if (kind === 'crypto') {
    const network = body.network === 'USDT BEP20' ? 'USDT BEP20' : 'USDT TRC20';
    const address = String(body.address || '').trim();
    if (address.length < 8) return { error: 'Enter a wallet address.' };
    return { values: { network, address } };
  }
  const holder = String(body.holder || '').trim();
  const bankName = String(body.bankName || '').trim();
  const iban = String(body.iban || '').trim().replace(/\s+/g, '');
  const accountNumber = String(body.accountNumber || '').trim();
  const mobile = String(body.mobile || '').trim();
  if (!holder || !bankName) return { error: 'Account holder and bank name are required.' };
  if (!iban && !accountNumber) return { error: 'Enter an IBAN or account number.' };
  const mobileDigits = mobile.replace(/\D/g, '');
  const invalidMobile = mobileDigits.length < 6 || mobileDigits.length > 15;
  if (mobileRequired ? invalidMobile : (mobileDigits && invalidMobile)) {
    return { error: 'Enter a valid mobile number.' };
  }
  return { values: { holder, bankName, iban, accountNumber, mobile } };
}

export async function addAccount({ userId, body }) {
  const user = await member(userId);
  if (!user) return { status: 401, message: 'Sign in required.' };
  const kind = body.kind === 'bank' ? 'bank' : 'crypto';
  const settings = await Settings.findOne({ key: 'platform' });
  const bankOn = !settings || settings.bankPayoutEnabled !== false;
  const cryptoOn = Boolean(settings && settings.cryptoPayoutEnabled === true);
  if (kind === 'crypto' && !cryptoOn) return { status: 400, message: 'Crypto accounts are turned off.' };
  if (kind === 'bank' && !bankOn) return { status: 400, message: 'Bank accounts are turned off.' };
  const normalized = normalizedAccount(kind, body);
  if (normalized.error) return { status: 400, message: normalized.error };
  const account = await WithdrawalAccount.create({
    userId: String(user._id), kind, ...normalized.values,
  });
  return { status: 201, data: { account: viewAccount(account) } };
}

export async function updateAccount({ userId, id, body }) {
  if (!mongoose.isValidObjectId(id)) return { status: 404, message: 'Account not found.' };
  const account = await WithdrawalAccount.findOne({ _id: id, userId: String(userId) });
  if (!account) return { status: 404, message: 'Account not found.' };
  const normalized = normalizedAccount(account.kind, body, { mobileRequired: false });
  if (normalized.error) return { status: 400, message: normalized.error };
  Object.assign(account, normalized.values);
  await account.save();
  return { status: 200, data: { account: viewAccount(account) } };
}

export async function removeAccount({ userId, id }) {
  if (!mongoose.isValidObjectId(id)) return { status: 404, message: 'Account not found.' };
  const row = await WithdrawalAccount.findOne({ _id: id, userId: String(userId) });
  if (!row) return { status: 404, message: 'Account not found.' };
  await row.deleteOne();
  return { status: 200, data: { ok: true } };
}

export async function cashIn({ userId }) {
  const user = await member(userId);
  if (!user) return { status: 401, message: 'Sign in required.' };
  return { status: 400, message: 'Cash in is completed on Telegram.' };
}

export { snapshot, viewTransaction };
