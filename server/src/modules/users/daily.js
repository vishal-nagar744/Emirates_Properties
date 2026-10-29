import { workDate } from '../../lib/workDate.js';
import { ProjectGroup } from '../groups/model.js';
import { UserPremium } from './premium-model.js';
import { clearNegativeWallet } from './premium-fund.js';

async function startPaidCycle(user, today) {
  user.progressCycleStart = today;
  user.progressCycleDone = false;
  const trial = await ProjectGroup.findOne({ isTrial: true }).select('_id');
  const filter = { userId: String(user._id) };
  if (trial) filter.groupId = { $ne: String(trial._id) };
  await UserPremium.updateMany(
    filter,
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
    if (user.progressCycleDone) await startPaidCycle(user, today);
    user.progressDate = today;
    changed = true;
  }

  if (await clearNegativeWallet(user)) changed = true;
  if (changed) await user.save();
  return user;
}
