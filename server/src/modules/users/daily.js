import { Transaction } from '../wallet/model.js';
import { workDate } from '../../lib/workDate.js';
import { UserPremium } from './premium-model.js';

export async function ensureDailyReset(user) {
  if (!user || user.role !== 'user') return user;
  const today = workDate();
  if (!user.progressDate) {
    user.progressDate = today;
    await user.save();
    return user;
  }
  if (user.progressDate === today) return user;

  const hold = Math.round((Number(user.holdBalance) || 0) * 100) / 100;
  if (hold > 0) {
    user.walletBalance = Math.round(((Number(user.walletBalance) || 0) + hold) * 100) / 100;
    user.holdBalance = 0;
    user.holdGroupId = '';
    await Transaction.create({
      userId: String(user._id),
      type: 'hold_release',
      amount: hold,
      direction: 'debit',
      wallet: 'hold',
      description: 'Daily reset',
      status: 'completed',
      referenceId: null,
    });
    await Transaction.create({
      userId: String(user._id),
      type: 'hold_release',
      amount: hold,
      direction: 'credit',
      wallet: 'main',
      description: 'Daily reset',
      status: 'completed',
      referenceId: null,
    });
  }

  user.groupAccessSet = false;
  user.unlockedGroupIds = [];
  user.lockedGroupIds = [];
  user.setAccessSet = false;
  user.unlockedSetKeys = [];
  user.progressDate = today;
  await user.save();
  await UserPremium.updateMany(
    { userId: String(user._id) },
    { $set: { opened: false, charged: false } },
  );
  return user;
}
