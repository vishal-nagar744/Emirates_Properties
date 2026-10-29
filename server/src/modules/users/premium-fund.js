import { Transaction } from '../wallet/model.js';
import { UserPremium } from './premium-model.js';

export function cents(value) {
  return Math.round((Number(value) || 0) * 100);
}

export function remainingPremiumCents(row) {
  if (!row || row.reward === 'cash') return 0;
  return Math.max(0, cents(row.price) - cents(row.fundedAmount));
}

export async function pendingPremium(userId) {
  const rows = await UserPremium.find({
    userId: String(userId),
    charged: true,
    reward: { $ne: 'cash' },
  }).sort({ setNumber: 1, position: 1, createdAt: 1 });
  return rows.find((row) => remainingPremiumCents(row) > 0) || null;
}

export async function clearNegativeWallet(user) {
  if (!user || cents(user.walletBalance) >= 0) return false;
  user.walletBalance = 0;
  return true;
}

export async function applyIncomingCredit(user, amount, { type, description, referenceId = null, wallet = 'main' } = {}) {
  const amountCents = cents(amount);
  if (!user || amountCents <= 0) return { toPremium: 0, toWallet: 0, premiumId: null };
  await clearNegativeWallet(user);
  const premium = await pendingPremium(user._id);
  const need = remainingPremiumCents(premium);
  const toPremium = premium ? Math.min(need, amountCents) : 0;
  const toWallet = amountCents - toPremium;
  if (toPremium > 0) {
    premium.fundedAmount = (cents(premium.fundedAmount) + toPremium) / 100;
    await premium.save();
    await Transaction.create({
      userId: String(user._id),
      type: 'premium_deposit',
      amount: toPremium / 100,
      direction: 'credit',
      wallet: 'premium',
      description: description ? `${description} · Premium project` : `${premium.name} · Premium deposit`,
      status: 'completed',
      referenceId: referenceId || String(premium._id),
    });
  }
  if (toWallet > 0) {
    user.walletBalance = (cents(user.walletBalance) + toWallet) / 100;
    await Transaction.create({
      userId: String(user._id),
      type: type || 'adjustment',
      amount: toWallet / 100,
      direction: 'credit',
      wallet,
      description: description || 'Cash in',
      status: 'completed',
      referenceId,
    });
  }
  await user.save();
  return {
    toPremium: toPremium / 100,
    toWallet: toWallet / 100,
    premiumId: toPremium > 0 && premium ? String(premium._id) : null,
  };
}
