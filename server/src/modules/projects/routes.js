import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth.js';
import { readToken } from '../auth/session.js';
import { createProject, getProject, listProjects, setProjectStatus, updateProject } from './service.js';

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
  const wantsAll = req.query.all === '1';
  if (wantsAll && (!session || session.role !== 'admin')) {
    return send(res, { status: 401, message: 'Admin sign in required.' });
  }
  const includeInactive = wantsAll || Boolean(session && (session.role === 'user' || session.role === 'admin'));
  send(res, await listProjects({ includeInactive }));
}));

router.get('/:id', route(async (req, res) => {
  send(res, await getProject(req.params.id));
}));

router.post('/', requireAdmin, route(async (req, res) => {
  send(res, await createProject(req.body || {}));
}));

router.patch('/:id', requireAdmin, route(async (req, res) => {
  send(res, await updateProject(req.params.id, req.body || {}));
}));

router.patch('/:id/status', requireAdmin, route(async (req, res) => {
  send(res, await setProjectStatus(req.params.id, (req.body || {}).status));
}));
