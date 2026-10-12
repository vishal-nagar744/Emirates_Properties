import { User } from './model.js';

const MIN_MEMBER_NO = 100000;
const MAX_MEMBER_NO = 999999;

export async function nextMemberNo() {
  const latest = await User.findOne({ memberNo: { $type: 'number' } })
    .sort({ memberNo: -1 })
    .select('memberNo')
    .lean();
  const next = latest && Number(latest.memberNo) >= MIN_MEMBER_NO
    ? Number(latest.memberNo) + 1
    : MIN_MEMBER_NO;
  if (next > MAX_MEMBER_NO) {
    throw new Error('No more member IDs available.');
  }
  return next;
}

export async function ensureMemberNos() {
  const missing = await User.find({
    role: 'user',
    $or: [{ memberNo: { $exists: false } }, { memberNo: null }],
  }).sort({ createdAt: 1 }).select('_id');
  if (!missing.length) return 0;
  let current = await nextMemberNo();
  for (const row of missing) {
    await User.updateOne({ _id: row._id }, { $set: { memberNo: current } });
    current += 1;
    if (current > MAX_MEMBER_NO) throw new Error('No more member IDs available.');
  }
  return missing.length;
}
