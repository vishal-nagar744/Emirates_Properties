import { Router } from 'express';
import { requireAdmin, requireUser } from '../../middleware/auth.js';
import { clientContext, listSessions, revokeOwnedSession } from './session.js';
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
  const body = req.body || {};
  send(res, await signup({
    fullName: body.fullName,
    mobile: body.mobile,
    password: body.password,
    invitationCode: body.invitationCode,
    context: clientContext(req, 'Sign up'),
  }));
}));

memberAuth.post('/login', route(async (req, res) => {
  const body = req.body || {};
  send(res, await loginMember({
    mobile: body.mobile,
    password: body.password,
    remember: Boolean(body.remember),
    context: clientContext(req, 'Password sign in'),
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
    loginPassword: body.loginPassword,
    currentSecurityPassword: body.currentSecurityPassword,
    securityPassword: body.securityPassword,
    currentWithdrawalPassword: body.currentWithdrawalPassword,
    withdrawalPassword: body.withdrawalPassword,
  }));
}));

memberAuth.post('/logout', route(async (req, res) => {
  send(res, await logout(bearer(req)));
}));

memberAuth.get('/sessions', requireUser, route(async (req, res) => {
  send(res, await listSessions(req.session.subjectId, req.session.sessionId));
}));

memberAuth.delete('/sessions/:id', requireUser, route(async (req, res) => {
  send(res, await revokeOwnedSession({
    subjectId: req.session.subjectId,
    sessionId: req.params.id,
    currentSessionId: req.session.sessionId,
    allowCurrent: false,
  }));
}));

memberAuth.get('/me', requireUser, route(async (req, res) => {
  const user = await memberFromSession(req.session);
  if (!user) return res.status(401).json({ message: 'Sign in required.' });
  return res.json({ user });
}));

export const adminAuth = Router();

adminAuth.post('/login', route(async (req, res) => {
  const body = req.body || {};
  send(res, await loginAdmin({
    id: body.id,
    password: body.password,
    context: clientContext(req, 'Admin sign in'),
  }));
}));

adminAuth.post('/logout', route(async (req, res) => {
  send(res, await logout(bearer(req)));
}));

adminAuth.get('/me', requireAdmin, route(async (req, res) => {
  const admin = await adminFromSession(req.session);
  if (!admin) return res.status(401).json({ message: 'Admin sign in required.' });
  return res.json({ admin });
}));
