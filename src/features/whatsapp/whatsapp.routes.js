import { Router } from 'express';
import * as whatsappController from './whatsapp.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';

const router = Router();

// Endpoint público para receber webhook do Evolution API
router.post('/webhook', whatsappController.webhook);

// Endpoints administrativos protegidos para gerenciar a conexão
router.get('/status', requireAuth, requireRole('admin'), whatsappController.getStatus);
router.post('/connect', requireAuth, requireRole('admin'), whatsappController.connect);
router.post('/disconnect', requireAuth, requireRole('admin'), whatsappController.disconnect);

export default router;
