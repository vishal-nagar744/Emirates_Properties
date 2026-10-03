import { Router } from 'express';
import { readImage } from './service.js';

export const router = Router();

router.get('/:id', async (req, res, next) => {
  try {
    const image = await readImage(req.params.id);
    if (!image) return res.status(404).json({ message: 'Image not found.' });
    res.set('Content-Type', image.contentType);
    res.set('Cache-Control', 'public, max-age=86400');
    return res.send(image.data);
  } catch (err) {
    return next(err);
  }
});
