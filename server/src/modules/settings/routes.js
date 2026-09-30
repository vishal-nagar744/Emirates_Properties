import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth.js';
import { getSettings, updateSettings } from './service.js';

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

router.get('/', route(async (_req, res) => {
  send(res, await getSettings());
}));

router.patch('/', requireAdmin, route(async (req, res) => {
  send(res, await updateSettings(req.body || {}));
}));
