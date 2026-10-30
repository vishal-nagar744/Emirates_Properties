export function workDate(date = new Date()) {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dubai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value);
}

export function orderWorkDate(order) {
  if (order && order.workDate) return String(order.workDate);
  const when = order && (order.createdAt || order.startDate);
  return when ? workDate(when) : '';
}

export function groupCycleStarts(user) {
  const starts = {};
  const rows = Array.isArray(user && user.groupCycles) ? user.groupCycles : [];
  rows.forEach((row) => {
    if (row && row.groupId && row.start) starts[String(row.groupId)] = String(row.start);
  });
  return starts;
}

export function cycleStartForGroup(user, groupId) {
  const starts = groupCycleStarts(user);
  const key = String(groupId || '');
  if (key && starts[key]) return starts[key];
  return String((user && user.progressCycleStart) || '');
}

export function inProgressCycle(order, user, isTrial, groupId) {
  if (isTrial) return true;
  const start = cycleStartForGroup(user, groupId || (order && order.groupId));
  if (!start) return true;
  return orderWorkDate(order) >= start;
}
