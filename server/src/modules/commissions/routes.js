import { Router } from 'express';
import { readToken } from '../auth/session.js';
import { listCommissions } from './service.js';

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

router.get('/', route(async (req, res) => {
  const header = req.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  const session = await readToken(match ? match[1].trim() : '');
  if (!session || session.role !== 'user') return send(res, { status: 401, message: 'Sign in required.' });
  send(res, await listCommissions({ userId: session.subjectId, orderId: req.query.orderId }));
}));
