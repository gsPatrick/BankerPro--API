import { Router } from 'express';
import * as whatsappController from './whatsapp.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';

const router = Router();

// Endpoint público para receber webhook da Z-API
router.post('/webhook', whatsappController.webhook);

// Conexão do WhatsApp do próprio usuário (vínculo por OTP)
router.get('/link-info', requireAuth, whatsappController.getLinkInfo);
router.post('/verify-code', requireAuth, whatsappController.verifyCode);

// Endpoints administrativos protegidos para gerenciar a conexão
router.get('/status', requireAuth, requireRole('admin'), whatsappController.getStatus);
router.post('/connect', requireAuth, requireRole('admin'), whatsappController.connect);
router.post('/disconnect', requireAuth, requireRole('admin'), whatsappController.disconnect);

export default router;
