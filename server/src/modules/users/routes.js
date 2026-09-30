import { Router } from 'express';
import { requireAdmin, requireUser } from '../../middleware/auth.js';
import {
  adjustMemberWallet,
  getMember,
  listMembers,
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

router.get('/:id', requireAdmin, route(async (req, res) => {
  send(res, await getMember(req.params.id));
}));

router.patch('/:id/status', requireAdmin, route(async (req, res) => {
  send(res, await setMemberStatus(req.params.id, (req.body || {}).accountStatus));
}));

router.post('/:id/adjustment', requireAdmin, route(async (req, res) => {
  const body = req.body || {};
  send(res, await adjustMemberWallet(req.params.id, { amount: body.amount, reason: body.reason }));
}));
