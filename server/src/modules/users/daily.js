import { inProgressCycle, orderWorkDate, workDate } from '../../lib/workDate.js';
import { ProjectGroup } from '../groups/model.js';
import { Order } from '../orders/model.js';
import { Project } from '../projects/model.js';
import { itemId, setNumberOf, setSequence } from '../projects/service.js';
import { UserPremium } from './premium-model.js';
import { clearNegativeWallet } from './premium-fund.js';

async function sequenceIds(userId, groupId) {
  const [projects, premiums] = await Promise.all([
    Project.find({ groupId: String(groupId) }),
    UserPremium.find({ userId: String(userId), groupId: String(groupId) }),
  ]);
  const ids = [];
  for (const setNumber of [1, 2, 3]) {
    const sequence = setSequence(
      projects.filter((project) => setNumberOf(project) === setNumber),
      premiums.filter((premium) => setNumberOf(premium) === setNumber),
    );
    sequence.forEach((item) => ids.push(itemId(item)));
  }
  return [...new Set(ids.filter(Boolean))];
}

async function groupsDueForRestart(user, today) {
  const flagged = (user.restartGroupIds || []).map(String).filter(Boolean);
  const groups = await ProjectGroup.find({ isTrial: { $ne: true } }).select('_id');
  const due = new Set(flagged);
  for (const group of groups) {
    const groupId = String(group._id);
    const ids = await sequenceIds(user._id, groupId);
    if (!ids.length) continue;
    const orders = await Order.find({
      userId: String(user._id),
      projectId: { $in: ids },
      status: { $ne: 'cancelled' },
    }).select('projectId groupId workDate createdAt startDate');
    const inCycle = orders.filter((row) => inProgressCycle(row, user, false, groupId));
    const done = new Set(inCycle.map((row) => String(row.projectId)));
    if (done.size < ids.length) continue;
    const last = inCycle.reduce((max, row) => {
      const day = orderWorkDate(row);
      return day > max ? day : max;
    }, '');
    if (last && last < today) due.add(groupId);
  }
  return [...due];
}

async function restartFinishedGroups(user, today) {
  const ids = await groupsDueForRestart(user, today);
  if (!ids.length) return false;
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
  return true;
}

export async function ensureDailyReset(user) {
  if (!user || user.role !== 'user') return user;
  const today = workDate();
  let changed = false;

  if (!user.progressDate) {
    user.progressDate = today;
    changed = true;
  }

  if (await restartFinishedGroups(user, today)) changed = true;

  if (user.progressDate !== today) {
    user.progressDate = today;
    changed = true;
  }

  if (await clearNegativeWallet(user)) changed = true;
  if (changed) await user.save();
  return user;
}
