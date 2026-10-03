import { Router } from 'express';
import { requireAdmin, requireUser } from '../../middleware/auth.js';
import { listSessions, revokeOwnedSession } from '../auth/session.js';
import {
  adjustMemberWallet,
  getMember,
  listMembers,
  memberDailyHistory,
  setMemberGroups,
  setMemberStatus,
  updateOwnProfile,
} from './service.js';

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

export const router = Router();

router.get('/me', requireUser, route(async (req, res) => {
  send(res, await getMember(req.session.subjectId));
}));

router.patch('/me', requireUser, route(async (req, res) => {
  const body = req.body || {};
  send(res, await updateOwnProfile(req.session, { fullName: body.fullName, mobile: body.mobile }));
}));

router.get('/', requireAdmin, route(async (req, res) => {
  send(res, await listMembers({ status: req.query.status, q: req.query.q }));
}));

router.get('/:id/history', requireAdmin, route(async (req, res) => {
  send(res, await memberDailyHistory(req.params.id));
}));

router.get('/:id/sessions', requireAdmin, route(async (req, res) => {
  const member = await getMember(req.params.id);
  if (member.message) return send(res, member);
  send(res, await listSessions(req.params.id, ''));
}));

router.delete('/:id/sessions/:sessionId', requireAdmin, route(async (req, res) => {
  const member = await getMember(req.params.id);
  if (member.message) return send(res, member);
  send(res, await revokeOwnedSession({
    subjectId: req.params.id,
    sessionId: req.params.sessionId,
    currentSessionId: '',
    allowCurrent: true,
  }));
}));

router.get('/:id', requireAdmin, route(async (req, res) => {
  send(res, await getMember(req.params.id));
}));

router.patch('/:id/status', requireAdmin, route(async (req, res) => {
  send(res, await setMemberStatus(req.params.id, (req.body || {}).accountStatus));
}));

router.patch('/:id/groups', requireAdmin, route(async (req, res) => {
  const body = req.body || {};
  send(res, await setMemberGroups(req.params.id, body.groupIds));
}));

router.post('/:id/adjustment', requireAdmin, route(async (req, res) => {
  const body = req.body || {};
  send(res, await adjustMemberWallet(req.params.id, { amount: body.amount, reason: body.reason }));
}));
