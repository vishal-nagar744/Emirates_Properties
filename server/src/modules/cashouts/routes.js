import { Router } from 'express';
import { requireAdmin, requireUser } from '../../middleware/auth.js';
import { listAll, listMine, requestCashOut, setCashoutStatus } from './service.js';

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

router.get('/all', requireAdmin, route(async (req, res) => {
  send(res, await listAll({ status: req.query.status }));
}));

router.get('/', requireUser, route(async (req, res) => {
  send(res, await listMine(req.session.subjectId));
}));

router.post('/', requireUser, route(async (req, res) => {
  const body = req.body || {};
  send(res, await requestCashOut({
    userId: req.session.subjectId,
    amount: body.amount,
    accountId: body.accountId,
    withdrawalPassword: body.withdrawalPassword,
  }));
}));

router.patch('/:id', requireAdmin, route(async (req, res) => {
  const body = req.body || {};
  send(res, await setCashoutStatus({
    id: req.params.id,
    status: body.status,
    rejectionReason: body.rejectionReason,
  }));
}));
