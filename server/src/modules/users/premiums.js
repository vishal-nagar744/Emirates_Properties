import mongoose from 'mongoose';
import { ProjectGroup } from '../groups/model.js';
import { User } from './model.js';
import { UserPremium, viewPremium } from './premium-model.js';

function money(value) {
  return Math.round(Number(value) * 100) / 100;
}

async function member(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  const user = await User.findById(id);
  if (!user || user.role !== 'user') return null;
  return user;
}

function readPremium(body, current) {
  const setNumber = Number(body && body.setNumber !== undefined ? body.setNumber : current && current.setNumber);
  const position = Number(body && body.position !== undefined ? body.position : current && current.position);
  const kind = String((body && body.kind) ?? (current && current.kind) ?? 'premium');
  const reward = kind === 'fortune'
    ? String((body && body.reward) ?? (current && current.reward) ?? 'cash')
    : 'project';
  const cash = kind === 'fortune' && reward === 'cash';
  const name = cash
    ? 'Cash reward'
    : String((body && body.name) ?? (current && current.name) ?? '').trim();
  const price = Number(body && body.price !== undefined ? body.price : current && current.price);
  const commissionRatio = cash
    ? 0
    : Number(body && body.commissionRatio !== undefined ? body.commissionRatio : current && current.commissionRatio);
  const groupId = String((body && body.groupId) ?? (current && current.groupId) ?? '').trim();
  if (kind !== 'premium' && kind !== 'fortune') return { status: 400, message: 'Choose a premium project or a fortune box.' };
  if (kind === 'fortune' && reward !== 'cash' && reward !== 'project') {
    return { status: 400, message: 'Choose cash or a premium project.' };
  }
  if (setNumber !== 1 && setNumber !== 2 && setNumber !== 3) {
    return { status: 400, message: 'Choose set 1, 2, or 3.' };
  }
  if (!Number.isInteger(position) || position < 1) {
    return { status: 400, message: 'Position must be 1 or more.' };
  }
  if (!name) return { status: 400, message: 'Enter a project name.' };
  if (!Number.isFinite(price) || price < 0 || (cash && price <= 0)) {
    return { status: 400, message: cash ? 'Enter a cash amount.' : 'Enter a valid price.' };
  }
  if (!Number.isFinite(commissionRatio) || commissionRatio < 0 || commissionRatio > 100) {
    return { status: 400, message: 'Commission ratio must be between 0 and 100.' };
  }
  if (!mongoose.isValidObjectId(groupId)) return { status: 400, message: 'Choose a group.' };
  return {
    value: {
      groupId,
      setNumber,
      position,
      name,
      price: money(price),
      commissionRatio: money(commissionRatio),
      commissionAmount: money((price * commissionRatio) / 100),
      kind,
      reward,
      opened: false,
    },
  };
}

export async function listPremiums({ userId, groupId }) {
  const user = await member(userId);
  if (!user) return { status: 404, message: 'User not found.' };
  const filter = { userId: String(user._id) };
  if (groupId) filter.groupId = String(groupId);
  const rows = await UserPremium.find(filter).sort({ setNumber: 1, position: 1, createdAt: 1 });
  return { status: 200, data: { premiums: rows.map(viewPremium) } };
}

export async function createPremium(userId, body) {
  const user = await member(userId);
  if (!user) return { status: 404, message: 'User not found.' };
  const parsed = readPremium(body);
  if (parsed.message) return parsed;
  const group = await ProjectGroup.exists({ _id: parsed.value.groupId });
  if (!group) return { status: 400, message: 'Choose a group.' };
  const taken = await UserPremium.exists({
    userId: String(user._id),
    groupId: parsed.value.groupId,
    setNumber: parsed.value.setNumber,
    position: parsed.value.position,
  });
  if (taken) return { status: 409, message: 'That position in this set is already used.' };
  const row = await UserPremium.create({ userId: String(user._id), ...parsed.value });
  return { status: 201, data: { premium: viewPremium(row) } };
}

export async function updatePremium(userId, premiumId, body) {
  const user = await member(userId);
  if (!user) return { status: 404, message: 'User not found.' };
  if (!mongoose.isValidObjectId(premiumId)) return { status: 404, message: 'Premium not found.' };
  const row = await UserPremium.findOne({ _id: premiumId, userId: String(user._id) });
  if (!row) return { status: 404, message: 'Premium not found.' };
  const parsed = readPremium(body, row);
  if (parsed.message) return parsed;
  const group = await ProjectGroup.exists({ _id: parsed.value.groupId });
  if (!group) return { status: 400, message: 'Choose a group.' };
  const taken = await UserPremium.exists({
    _id: { $ne: row._id },
    userId: String(user._id),
    groupId: parsed.value.groupId,
    setNumber: parsed.value.setNumber,
    position: parsed.value.position,
  });
  if (taken) return { status: 409, message: 'That position in this set is already used.' };
  const priceChanged = money(row.price) !== parsed.value.price
    || row.kind !== parsed.value.kind
    || (row.reward || 'project') !== parsed.value.reward;
  Object.assign(row, parsed.value);
  if (priceChanged) row.charged = false;
  await row.save();
  return { status: 200, data: { premium: viewPremium(row) } };
}

export async function deletePremium(userId, premiumId) {
  const user = await member(userId);
  if (!user) return { status: 404, message: 'User not found.' };
  if (!mongoose.isValidObjectId(premiumId)) return { status: 404, message: 'Premium not found.' };
  const row = await UserPremium.findOne({ _id: premiumId, userId: String(user._id) });
  if (!row) return { status: 404, message: 'Premium not found.' };
  await row.deleteOne();
  return { status: 200, data: { ok: true } };
}
