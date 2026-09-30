import { Router } from 'express';
import { requireUser } from '../../middleware/auth.js';
import { addAccount, cashIn, listAccounts, listTransactions, removeAccount } from './service.js';

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

router.get('/transactions', requireUser, route(async (req, res) => {
  send(res, await listTransactions(req.session.subjectId));
}));

router.get('/accounts', requireUser, route(async (req, res) => {
  send(res, await listAccounts(req.session.subjectId));
}));

router.post('/accounts', requireUser, route(async (req, res) => {
  send(res, await addAccount({ userId: req.session.subjectId, body: req.body || {} }));
}));

router.delete('/accounts/:id', requireUser, route(async (req, res) => {
  send(res, await removeAccount({ userId: req.session.subjectId, id: req.params.id }));
}));

router.post('/cash-in', requireUser, route(async (req, res) => {
  send(res, await cashIn({ userId: req.session.subjectId, amount: (req.body || {}).amount }));
}));
