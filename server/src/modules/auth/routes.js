import { Router } from 'express';
import { requireAdmin, requireUser } from '../../middleware/auth.js';
import {
  adminFromSession,
  changePassword,
  forgotPassword,
  setWithdrawalPassword,
  loginAdmin,
  loginMember,
  logout,
  memberFromSession,
  signup,
} from './service.js';

function bearer(req) {
  const header = req.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

function send(res, result) {
  if (result.message) return res.status(result.status).json({ message: result.message });
  return res.status(result.status).json(result.data);
}

function route(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res);
    } catch (err) {
      next(err);
    }
  };
}

export const memberAuth = Router();

memberAuth.post('/signup', route(async (req, res) => {
  send(res, await signup(req.body || {}));
}));

memberAuth.post('/login', route(async (req, res) => {
  const body = req.body || {};
  send(res, await loginMember({
    mobile: body.mobile,
    password: body.password,
    remember: Boolean(body.remember),
  }));
}));

memberAuth.post('/forgot-password', route(async (req, res) => {
  const body = req.body || {};
  send(res, await forgotPassword({ mobile: body.mobile, password: body.password }));
}));

memberAuth.post('/password', requireUser, route(async (req, res) => {
  const body = req.body || {};
  send(res, await changePassword({
    session: req.session,
    currentPassword: body.currentPassword,
    newPassword: body.newPassword,
  }));
}));

memberAuth.post('/withdrawal-password', requireUser, route(async (req, res) => {
  const body = req.body || {};
  send(res, await setWithdrawalPassword({
    session: req.session,
    currentPassword: body.currentPassword,
    newPassword: body.newPassword,
  }));
}));

memberAuth.post('/logout', route(async (req, res) => {
  send(res, await logout(bearer(req)));
}));

memberAuth.get('/me', requireUser, route(async (req, res) => {
  const user = await memberFromSession(req.session);
  if (!user) return res.status(401).json({ message: 'Sign in required.' });
  return res.json({ user });
}));

export const adminAuth = Router();

adminAuth.post('/login', route(async (req, res) => {
  const body = req.body || {};
  send(res, await loginAdmin({ id: body.id, password: body.password }));
}));

adminAuth.post('/logout', route(async (req, res) => {
  send(res, await logout(bearer(req)));
}));

adminAuth.get('/me', requireAdmin, route(async (req, res) => {
  const admin = await adminFromSession(req.session);
  if (!admin) return res.status(401).json({ message: 'Admin sign in required.' });
  return res.json({ admin });
}));
