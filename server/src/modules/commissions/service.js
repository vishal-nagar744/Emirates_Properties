import { Commission, viewCommission } from './model.js';
import { settleUser } from '../orders/service.js';

export async function listCommissions({ userId, orderId }) {
  if (userId) await settleUser(userId);
  const filter = { userId: String(userId) };
  if (orderId) filter.orderId = String(orderId);
  const rows = await Commission.find(filter).sort({ date: -1, dayIndex: -1 });
  return { status: 200, data: { commissions: rows.map(viewCommission) } };
}
