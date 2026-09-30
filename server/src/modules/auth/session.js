import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import { Session } from './model.js';

function isLocal(ip) {
  const value = String(ip || '');
  return value === '127.0.0.1' || value === '::1' || value === 'localhost';
}

export function parseAgent(userAgent) {
  const agent = String(userAgent || '');
  let browser = '';
  if (/Edg\//.test(agent)) browser = 'Edge';
  else if (/OPR\//.test(agent)) browser = 'Opera';
  else if (/Chrome\//.test(agent)) browser = 'Chrome';
  else if (/Firefox\//.test(agent)) browser = 'Firefox';
  else if (/Safari\//.test(agent)) browser = 'Safari';

  let os = '';
  if (/Windows NT/.test(agent)) os = 'Windows';
  else if (/Mac OS X/.test(agent)) os = 'macOS';
  else if (/Android/.test(agent)) os = 'Android';
  else if (/iPhone|iPad/.test(agent)) os = 'iOS';
  else if (/Linux/.test(agent)) os = 'Linux';

  let device = '';
  if (/iPad|Tablet/.test(agent)) device = 'Tablet';
  else if (/Mobile|iPhone|Android/.test(agent)) device = 'Mobile';
  else if (agent) device = 'Desktop';

  return { browser, os, device };
}

export function clientContext(req, method) {
  const forwarded = String(req.get('x-forwarded-for') || '').split(',')[0].trim();
  const ip = (forwarded || req.ip || '').replace(/^::ffff:/, '');
  const userAgent = String(req.get('user-agent') || '');
  return {
    ip,
    userAgent,
    method: method || '',
    location: isLocal(ip) ? 'Local network' : '',
    ...parseAgent(userAgent),
  };
}

async function resolveLocation(sessionId, ip) {
  if (!ip || isLocal(ip)) return;
  try {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, { signal: AbortSignal.timeout(1500) });
    const data = await res.json();
    if (!data || data.success === false) return;
    const place = [data.city, data.region, data.country].filter(Boolean).join(', ');
    if (place) await Session.updateOne({ _id: sessionId, location: '' }, { location: place });
  } catch {
    /* location stays blank when the lookup is unavailable */
  }
}

export async function issueToken({ role, subjectId, ttlMs, context }) {
  const now = new Date();
  const ctx = context || {};
  const session = await Session.create({
    token: randomBytes(32).toString('hex'),
    role,
    subjectId: String(subjectId),
    expiresAt: new Date(Date.now() + ttlMs),
    ip: ctx.ip || '',
    location: ctx.location || '',
    device: ctx.device || '',
    browser: ctx.browser || '',
    os: ctx.os || '',
    userAgent: ctx.userAgent || '',
    method: ctx.method || '',
    loginAt: now,
    lastActiveAt: now,
    revokedAt: null,
  });
  if (ctx.ip && !ctx.location) resolveLocation(session._id, ctx.ip);
  return session.token;
}

export async function readToken(token) {
  if (!token) return null;
  const session = await Session.findOne({ token });
  if (!session || session.revokedAt) return null;
  if (session.expiresAt.getTime() <= Date.now()) return null;
  const now = Date.now();
  const last = session.lastActiveAt ? new Date(session.lastActiveAt).getTime() : 0;
  if (now - last > 60000) {
    session.lastActiveAt = new Date(now);
    await session.save();
  }
  return { role: session.role, subjectId: session.subjectId, sessionId: String(session._id) };
}

export function viewSession(row, currentSessionId) {
  const revoked = Boolean(row.revokedAt);
  const expired = row.expiresAt && row.expiresAt.getTime() <= Date.now();
  let status = 'active';
  if (revoked) status = 'revoked';
  else if (expired) status = 'expired';
  const loginAt = row.loginAt || row.createdAt || null;
  const lastActiveAt = row.lastActiveAt || loginAt;
  return {
    id: String(row._id),
    ip: row.ip || '',
    location: row.location || '',
    device: row.device || '',
    browser: row.browser || '',
    os: row.os || '',
    userAgent: row.userAgent || '',
    method: row.method || '',
    loginAt: loginAt ? new Date(loginAt).toISOString() : '',
    lastActiveAt: lastActiveAt ? new Date(lastActiveAt).toISOString() : '',
    status,
    current: String(row._id) === String(currentSessionId || ''),
  };
}

export async function listSessions(subjectId, currentSessionId) {
  const rows = await Session.find({ subjectId: String(subjectId), role: 'user' }).sort({ loginAt: -1, createdAt: -1 });
  return { status: 200, data: { sessions: rows.map((row) => viewSession(row, currentSessionId)) } };
}

export async function revokeToken(token) {
  if (!token) return;
  await Session.updateOne({ token, revokedAt: null }, { revokedAt: new Date() });
}

export async function revokeUserSessions(subjectId) {
  if (!subjectId) return;
  await Session.updateMany(
    { subjectId: String(subjectId), revokedAt: null },
    { revokedAt: new Date() }
  );
}

export async function revokeOwnedSession({ subjectId, sessionId, currentSessionId, allowCurrent }) {
  if (!mongoose.isValidObjectId(sessionId)) return { status: 404, message: 'Session not found.' };
  const row = await Session.findOne({ _id: sessionId, subjectId: String(subjectId), role: 'user' });
  if (!row) return { status: 404, message: 'Session not found.' };
  if (!allowCurrent && String(row._id) === String(currentSessionId || '')) {
    return { status: 400, message: 'This is the session you are using. Log out to end it.' };
  }
  if (!row.revokedAt) {
    row.revokedAt = new Date();
    await row.save();
  }
  return { status: 200, data: { session: viewSession(row, currentSessionId) } };
}
