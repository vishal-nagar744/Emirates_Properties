import { Router } from 'express';
import { requireAdmin, requireUser } from '../../middleware/auth.js';
import {
  activeAnnouncementsForUser,
  createAnnouncement,
  deleteAnnouncement,
  dismissAnnouncement,
  duplicateAnnouncement,
  listAnnouncements,
  markAnnouncementSeen,
  setAnnouncementStatus,
  updateAnnouncement,
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

router.get('/active', requireUser, route(async (req, res) => {
  send(res, await activeAnnouncementsForUser(req.session));
}));

router.post('/:id/seen', requireUser, route(async (req, res) => {
  send(res, await markAnnouncementSeen(
    req.session.subjectId,
    req.params.id,
    (req.body || {}).occurrenceKey
  ));
}));

router.post('/:id/dismiss', requireUser, route(async (req, res) => {
  send(res, await dismissAnnouncement(
    req.session.subjectId,
    req.params.id,
    (req.body || {}).occurrenceKey
  ));
}));

router.get('/', requireAdmin, route(async (_req, res) => {
  send(res, await listAnnouncements());
}));

router.post('/', requireAdmin, route(async (req, res) => {
  send(res, await createAnnouncement(req.body || {}, req.session));
}));

router.patch('/:id', requireAdmin, route(async (req, res) => {
  send(res, await updateAnnouncement(req.params.id, req.body || {}));
}));

router.post('/:id/publish', requireAdmin, route(async (req, res) => {
  send(res, await setAnnouncementStatus(req.params.id, 'active'));
}));

router.post('/:id/pause', requireAdmin, route(async (req, res) => {
  send(res, await setAnnouncementStatus(req.params.id, 'paused'));
}));

router.post('/:id/duplicate', requireAdmin, route(async (req, res) => {
  send(res, await duplicateAnnouncement(req.params.id));
}));

router.delete('/:id', requireAdmin, route(async (req, res) => {
  send(res, await deleteAnnouncement(req.params.id));
}));
