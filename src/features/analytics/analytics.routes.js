import { Router } from 'express';
import express from 'express';
import * as analyticsController from './analytics.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';
import { publicCollectRateLimit } from '../../middlewares/rate-limit.middleware.js';

const router = Router();

// Coleta pública (a landing envia sem estar logada). Aceita text/plain porque o
// navigator.sendBeacon manda assim para evitar preflight de CORS; o controller
// faz o parse. Limite pequeno: é um lote de eventos, não upload.
// Teto por IP: é rota aberta que grava no banco, então sem limite alguém enche
// as tabelas de analytics com lixo.
router.post(
  '/collect',
  publicCollectRateLimit,
  express.text({ type: ['text/plain', 'application/json'], limit: '64kb' }),
  analyticsController.collect
);

// Leituras protegidas (somente admin).
router.get('/overview', requireAuth, requireRole('admin'), analyticsController.overview);
router.get('/visitors', requireAuth, requireRole('admin'), analyticsController.visitors);
router.get('/visitors/:visitorId', requireAuth, requireRole('admin'), analyticsController.visitorDetail);
router.get('/abandoned', requireAuth, requireRole('admin'), analyticsController.abandoned);

export default router;
