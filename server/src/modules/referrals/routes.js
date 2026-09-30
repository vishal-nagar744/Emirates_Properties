import { Router } from 'express';
import { readToken } from '../auth/session.js';
import { requireAdmin, requireUser } from '../../middleware/auth.js';
import { listForAdmin, listForMember } from './service.js';

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

router.get('/', requireUser, route(async (req, res) => {
  send(res, await listForMember(req.session.subjectId));
}));

router.get('/all', requireAdmin, route(async (req, res) => {
  send(res, await listForAdmin({ q: req.query.q }));
}));
