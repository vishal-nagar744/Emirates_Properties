import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth.js';
import { createGroup, deleteGroup, getGroup, listGroups, updateGroup } from './service.js';

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
  send(res, await listGroups());
}));

router.get('/:id', route(async (req, res) => {
  send(res, await getGroup(req.params.id));
}));

router.post('/', requireAdmin, route(async (req, res) => {
  send(res, await createGroup(req.body || {}));
}));

router.patch('/:id', requireAdmin, route(async (req, res) => {
  send(res, await updateGroup(req.params.id, req.body || {}));
}));

router.delete('/:id', requireAdmin, route(async (req, res) => {
  send(res, await deleteGroup(req.params.id));
}));
