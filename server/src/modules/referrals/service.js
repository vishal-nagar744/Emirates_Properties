import mongoose from 'mongoose';
import { Referral } from './model.js';
import { User } from '../users/model.js';

function maskMobile(mobile) {
  const digits = String(mobile || '').replace(/\D/g, '');
  if (digits.length < 4) return mobile || '';
  return `••••${digits.slice(-4)}`;
}

async function present(rows) {
  const ids = [...new Set(rows.flatMap((row) => [row.referrerUserId, row.referredUserId]))]
    .filter((id) => mongoose.isValidObjectId(id));
  const users = await User.find({ _id: { $in: ids } });
  const byId = new Map(users.map((user) => [String(user._id), user]));
  return rows.map((row) => {
    const member = byId.get(row.referredUserId);
    const referrer = byId.get(row.referrerUserId);
    return {
      id: String(row._id),
      name: member ? member.fullName : 'Member',
      mobile: member ? member.mobile : '',
      date: row.createdAt ? new Date(row.createdAt).toISOString().slice(0, 10) : '',
      status: member ? member.accountStatus : 'active',
      referrerId: row.referrerUserId,
      referrerName: referrer ? referrer.fullName : '—',
      referralCode: referrer ? referrer.referralCode : row.referralCodeUsed,
      referralCodeUsed: row.referralCodeUsed,
    };
  });
}

export async function listForMember(userId) {
  const rows = await Referral.find({ referrerUserId: String(userId) }).sort({ createdAt: -1 });
  const items = await present(rows);
  return {
    status: 200,
    data: {
      referrals: items.map((item) => ({
        ...item,
        mobile: maskMobile(item.mobile),
      })),
    },
  };
}

export async function listForAdmin({ q }) {
  const rows = await Referral.find().sort({ createdAt: -1 });
  let items = await present(rows);
  const query = String(q || '').trim().toLowerCase();
  if (query) {
    items = items.filter((item) => `${item.name} ${item.mobile} ${item.referrerName} ${item.referralCode}`.toLowerCase().includes(query));
  }
  return { status: 200, data: { referrals: items } };
}
