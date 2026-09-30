import { readToken } from '../modules/auth/session.js';

function bearer(req) {
  const header = req.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

export async function requireUser(req, res, next) {
  try {
    const session = await readToken(bearer(req));
    if (!session || session.role !== 'user') {
      return res.status(401).json({ message: 'Sign in required.' });
    }
    req.session = session;
    return next();
  } catch (err) {
    return next(err);
  }
}

export async function requireAdmin(req, res, next) {
  try {
    const session = await readToken(bearer(req));
    if (!session || session.role !== 'admin') {
      return res.status(401).json({ message: 'Admin sign in required.' });
    }
    req.session = session;
    return next();
  } catch (err) {
    return next(err);
  }
}
