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

export function inProgressCycle(order, user, isTrial) {
  if (isTrial) return true;
  const start = String((user && user.progressCycleStart) || '');
  if (!start) return true;
  return orderWorkDate(order) >= start;
}
