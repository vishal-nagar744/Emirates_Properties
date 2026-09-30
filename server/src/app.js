import cors from 'cors';
import express from 'express';
import { adminAuth, memberAuth } from './modules/auth/routes.js';
import { router as cashouts } from './modules/cashouts/routes.js';
import { router as commissions } from './modules/commissions/routes.js';
import { router as orders } from './modules/orders/routes.js';
import { router as projects } from './modules/projects/routes.js';
import { router as referrals } from './modules/referrals/routes.js';
import { router as settings } from './modules/settings/routes.js';
import { router as users } from './modules/users/routes.js';
import { router as wallet } from './modules/wallet/routes.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', memberAuth);
  app.use('/api/admin/auth', adminAuth);
  app.use('/api/users', users);
  app.use('/api/projects', projects);
  app.use('/api/orders', orders);
  app.use('/api/commissions', commissions);
  app.use('/api/wallet', wallet);
  app.use('/api/cashouts', cashouts);
  app.use('/api/referrals', referrals);
  app.use('/api/settings', settings);

  app.use((_req, res) => {
    res.status(404).json({ message: 'Not found.' });
  });

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong.' });
  });

  return app;
}
