import mongoose from 'mongoose';
import { config } from '../../config.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import { Referral } from '../referrals/model.js';
import { Settings } from '../settings/model.js';
import { Transaction } from '../wallet/model.js';
import { User } from '../users/model.js';
import { issueToken, revokeToken, revokeUserSessions } from './session.js';

function digits(value) {
  return String(value || '').replace(/\D/g, '');
}

function publicUser(user) {
  return {
    id: String(user._id),
    fullName: user.fullName,
    mobile: user.mobile,
    loginId: user.loginId || '',
    role: user.role,
    referralCode: user.referralCode,
    accountStatus: user.accountStatus,
    walletBalance: user.walletBalance,
    pendingCashOut: user.pendingCashOut || 0,
    hasWithdrawalPassword: Boolean(user.withdrawalPasswordHash),
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : '',
  };
}

async function findByMobile(mobile) {
  const key = digits(mobile);
  if (!key) return null;
  return User.findOne({ mobileDigits: key });
}

async function findById(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return User.findById(id);
}

async function referralCodeFor(fullName) {
  const base = String(fullName).replace(/[^a-z]/gi, '').slice(0, 4).toUpperCase() || 'USER';
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  for (let i = 0; i < 30; i += 1) {
    const num = String(10 + Math.floor(Math.random() * 90));
    const letter = letters[Math.floor(Math.random() * letters.length)];
    const code = `${base}${num}${letter}`;
    const taken = await User.exists({ referralCode: code });
    if (!taken) return code;
  }
  return `${base}${Date.now().toString().slice(-4)}`;
}

function statusError(user) {
  if (user.accountStatus === 'frozen') return 'This account is frozen.';
  if (user.accountStatus === 'suspended') return 'This account is suspended.';
  return '';
}

async function platformSettings() {
  const settings = await Settings.findOne({ key: 'platform' });
  if (!settings) return { welcomeBonusAmount: 100 };
  return settings;
}

export async function signup({ fullName, mobile, password, invitationCode }) {
  const name = String(fullName || '').trim();
  const phone = String(mobile || '').trim();
  const pass = String(password || '');
  const code = invitationCode ? String(invitationCode).trim().toUpperCase() : '';

  if (!name) return { status: 400, message: 'Enter your full name.' };
  if (digits(phone).length < 8) return { status: 400, message: 'Enter a valid mobile number.' };
  if (pass.length < 6) return { status: 400, message: 'Password must be at least 6 characters.' };
  if (await findByMobile(phone)) return { status: 409, message: 'This mobile number is already registered.' };

  let referrer = null;
  if (code) {
    referrer = await User.findOne({ referralCode: code, role: 'user' });
    if (!referrer) return { status: 400, message: 'Invitation code not recognised.' };
  }

  const settings = await platformSettings();
  const bonus = Number(settings.welcomeBonusAmount) || 0;
  const user = new User({
    fullName: name,
    mobile: phone,
    mobileDigits: digits(phone),
    passwordHash: hashPassword(pass),
    withdrawalPasswordHash: '',
    role: 'user',
    referralCode: await referralCodeFor(name),
    referredBy: referrer ? String(referrer._id) : null,
    accountStatus: 'active',
    welcomeBonusReceived: bonus > 0,
    walletBalance: bonus,
    pendingCashOut: 0,
  });

  try {
    await user.save();
  } catch (err) {
    if (err && err.code === 11000) {
      return { status: 409, message: 'This mobile number is already registered.' };
    }
    throw err;
  }

  if (referrer) {
    await Referral.create({
      referrerUserId: String(referrer._id),
      referredUserId: String(user._id),
      referralCodeUsed: code,
    });
  }

  if (bonus > 0) {
    await Transaction.create({
      userId: String(user._id),
      type: 'welcome_bonus',
      amount: bonus,
      direction: 'credit',
      description: 'Welcome bonus',
      status: 'completed',
      referenceId: null,
    });
  }

  const token = await issueToken({
    role: 'user',
    subjectId: String(user._id),
    ttlMs: config.sessionTtlMs,
  });
  return { status: 201, data: { message: 'Account created.', token, user: publicUser(user) } };
}

export async function loginMember({ mobile, password, remember }) {
  const user = await findByMobile(mobile);
  if (!user || user.role !== 'user' || !verifyPassword(password, user.passwordHash)) {
    return { status: 401, message: 'Incorrect mobile number or password.' };
  }
  const blocked = statusError(user);
  if (blocked) return { status: 403, message: blocked };

  const token = await issueToken({
    role: 'user',
    subjectId: String(user._id),
    ttlMs: remember ? config.rememberTtlMs : config.sessionTtlMs,
  });
  return { status: 200, data: { token, user: publicUser(user) } };
}

export async function setWithdrawalPassword({ session, currentPassword, newPassword }) {
  const user = await findById(session && session.subjectId);
  if (!user || user.role !== 'user') return { status: 401, message: 'Sign in required.' };
  const next = String(newPassword || '');
  if (next.length < 6) return { status: 400, message: 'Use at least 6 characters.' };
  if (user.withdrawalPasswordHash) {
    if (!verifyPassword(currentPassword, user.withdrawalPasswordHash)) {
      return { status: 400, message: 'Current withdrawal password is incorrect.' };
    }
  }
  if (user.withdrawalPasswordHash && verifyPassword(next, user.withdrawalPasswordHash)) {
    return { status: 400, message: 'Choose a different withdrawal password.' };
  }
  user.withdrawalPasswordHash = hashPassword(next);
  await user.save();
  return { status: 200, data: { message: 'Withdrawal password saved.', user: publicUser(user) } };
}

export async function forgotPassword({ mobile, password }) {
  if (digits(mobile).length < 8) return { status: 400, message: 'Enter a valid mobile number.' };
  const next = String(password || '');
  if (next.length < 6) return { status: 400, message: 'Password must be at least 6 characters.' };
  const user = await findByMobile(mobile);
  if (!user || user.role !== 'user') return { status: 404, message: 'No account found for this mobile number.' };
  user.passwordHash = hashPassword(next);
  await user.save();
  await revokeUserSessions(user._id);
  return { status: 200, data: { message: 'Password updated.' } };
}

export async function changePassword({ session, currentPassword, newPassword }) {
  const user = await findById(session && session.subjectId);
  if (!user || user.role !== 'user') return { status: 401, message: 'Sign in required.' };
  const next = String(newPassword || '');
  if (!verifyPassword(currentPassword, user.passwordHash)) {
    return { status: 400, message: 'Current password is incorrect.' };
  }
  if (next.length < 6) return { status: 400, message: 'New password must be at least 6 characters.' };
  if (verifyPassword(next, user.passwordHash)) {
    return { status: 400, message: 'Choose a different password.' };
  }
  user.passwordHash = hashPassword(next);
  await user.save();
  return { status: 200, data: { message: 'Password updated.', user: publicUser(user) } };
}

export async function logout(token) {
  await revokeToken(token);
  return { status: 200, data: { message: 'Signed out.' } };
}

export async function memberFromSession(session) {
  if (!session || session.role !== 'user') return null;
  const user = await findById(session.subjectId);
  if (!user || user.role !== 'user') return null;
  return publicUser(user);
}

export async function loginAdmin({ id, password }) {
  const adminId = String(id || '').trim();
  const pass = String(password || '');
  if (!adminId || !pass) return { status: 400, message: 'Enter your admin ID and password.' };
  const admin = await User.findOne({ role: 'admin', loginId: adminId });
  if (!admin || !verifyPassword(pass, admin.passwordHash)) {
    return { status: 401, message: 'Incorrect admin ID or password.' };
  }
  const blocked = statusError(admin);
  if (blocked) return { status: 403, message: blocked };

  const token = await issueToken({
    role: 'admin',
    subjectId: String(admin._id),
    ttlMs: config.sessionTtlMs,
  });
  return { status: 200, data: { token, admin: publicUser(admin) } };
}

export async function adminFromSession(session) {
  if (!session || session.role !== 'admin') return null;
  const admin = await findById(session.subjectId);
  if (!admin || admin.role !== 'admin') return null;
  return publicUser(admin);
}
