import { Router } from 'express';
import * as whatsappController from './whatsapp.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';
import { linkCodeRateLimit, webhookRateLimit } from '../../middlewares/rate-limit.middleware.js';

const router = Router();

// Endpoint público para receber webhook da Z-API
router.post('/webhook', webhookRateLimit, whatsappController.webhook);

// Conexão do WhatsApp do próprio usuário (vínculo por OTP)
router.get('/link-info', requireAuth, whatsappController.getLinkInfo);
// O código confere contra qualquer vínculo pendente, então o teto de tentativas
// é o que impede alguém de chutar até acertar o número de outra pessoa.
router.post('/verify-code', requireAuth, linkCodeRateLimit, whatsappController.verifyCode);

// Endpoints administrativos protegidos para gerenciar a conexão
router.get('/status', requireAuth, requireRole('admin'), whatsappController.getStatus);
router.post('/connect', requireAuth, requireRole('admin'), whatsappController.connect);
router.post('/disconnect', requireAuth, requireRole('admin'), whatsappController.disconnect);

export default router;
