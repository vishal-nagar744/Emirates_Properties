import { workDate } from '../../lib/workDate.js';
import { UserPremium } from './premium-model.js';
import { clearNegativeWallet } from './premium-fund.js';

async function restartFinishedGroups(user, today) {
  const ids = [...new Set((user.restartGroupIds || []).map(String).filter(Boolean))];
  if (!ids.length) return;
  const starts = new Map(
    (Array.isArray(user.groupCycles) ? user.groupCycles : [])
      .filter((row) => row && row.groupId && row.start)
      .map((row) => [String(row.groupId), String(row.start)]),
  );
  ids.forEach((groupId) => starts.set(groupId, today));
  user.groupCycles = [...starts.entries()].map(([groupId, start]) => ({ groupId, start }));
  user.restartGroupIds = [];
  user.progressCycleDone = false;
  await UserPremium.updateMany(
    { userId: String(user._id), groupId: { $in: ids } },
    { $set: { opened: false, charged: false, fundedAmount: 0 } },
  );
}

export async function ensureDailyReset(user) {
  if (!user || user.role !== 'user') return user;
  const today = workDate();
  let changed = false;

  if (!user.progressDate) {
    user.progressDate = today;
    changed = true;
  }

  if (user.progressDate !== today) {
    await restartFinishedGroups(user, today);
    user.progressDate = today;
    changed = true;
  }

  if (await clearNegativeWallet(user)) changed = true;
  if (changed) await user.save();
  return user;
}
