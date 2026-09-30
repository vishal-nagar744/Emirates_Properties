import { Router } from 'express';
import { readToken } from '../auth/session.js';
import { requireUser } from '../../middleware/auth.js';
import { activateOrder, getOrder, listOrders } from './service.js';

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

async function sessionOf(req) {
  const header = req.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return readToken(match ? match[1].trim() : '');
}

export const router = Router();

router.get('/', route(async (req, res) => {
  const session = await sessionOf(req);
  if (!session) return send(res, { status: 401, message: 'Sign in required.' });
  if (req.query.all === '1') {
    if (session.role !== 'admin') return send(res, { status: 401, message: 'Admin sign in required.' });
    return send(res, await listOrders({ all: true }));
  }
  if (session.role !== 'user') return send(res, { status: 401, message: 'Sign in required.' });
  return send(res, await listOrders({ userId: session.subjectId }));
}));

router.post('/', requireUser, route(async (req, res) => {
  send(res, await activateOrder({ userId: req.session.subjectId, projectId: (req.body || {}).projectId }));
}));

router.get('/:id', route(async (req, res) => {
  const session = await sessionOf(req);
  if (!session) return send(res, { status: 401, message: 'Sign in required.' });
  send(res, await getOrder({
    id: req.params.id,
    userId: session.subjectId,
    admin: session.role === 'admin',
  }));
}));
