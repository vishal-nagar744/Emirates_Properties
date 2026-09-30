import { randomBytes } from 'node:crypto';
import { Session } from './model.js';

export async function issueToken({ role, subjectId, ttlMs }) {
  const token = randomBytes(32).toString('hex');
  await Session.create({
    token,
    role,
    subjectId,
    expiresAt: new Date(Date.now() + ttlMs),
  });
  return token;
}

export async function readToken(token) {
  if (!token) return null;
  const session = await Session.findOne({ token });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await Session.deleteOne({ token });
    return null;
  }
  return { role: session.role, subjectId: session.subjectId };
}

export async function revokeToken(token) {
  if (token) await Session.deleteOne({ token });
}

export async function revokeUserSessions(subjectId) {
  if (subjectId) await Session.deleteMany({ subjectId: String(subjectId) });
}
