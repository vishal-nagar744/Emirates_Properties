import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router } from 'express';
import multer from 'multer';
import { config } from '../../config.js';
import { requireAdmin } from '../../middleware/auth.js';
import { readToken } from '../auth/session.js';
import { createProject, deleteProject, getProject, listProjects, setProjectStatus, updateProject } from './service.js';

const uploadDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename(_req, file, callback) {
      const ext = path.extname(file.originalname || '').toLowerCase();
      callback(null, `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter(_req, file, callback) {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const okType = /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype);
    const okExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
    if (!okType || !okExt) {
      callback(new Error('Upload a JPG, PNG, WEBP, or GIF image.'));
      return;
    }
    callback(null, true);
  },
});

function receiveImage(req, res) {
  return new Promise((resolve, reject) => {
    upload.single('image')(req, res, (err) => (err ? reject(err) : resolve()));
  });
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

router.post('/image', requireAdmin, route(async (req, res) => {
  try {
    await receiveImage(req, res);
  } catch (err) {
    const message = err && err.code === 'LIMIT_FILE_SIZE'
      ? 'Image must be 4 MB or smaller.'
      : (err && err.message) || 'Could not upload the image.';
    return res.status(400).json({ message });
  }
  if (!req.file) return res.status(400).json({ message: 'Choose an image file.' });
  return res.status(201).json({ image: `${config.publicApiUrl}/uploads/${req.file.filename}` });
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

router.delete('/:id', requireAdmin, route(async (req, res) => {
  send(res, await deleteProject(req.params.id));
}));
