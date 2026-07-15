import { Router } from 'express';
import * as settingsController from './settings.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/sessions', settingsController.listSessions);
router.post('/sessions/ping', settingsController.pingSession);
router.delete('/sessions/:id', settingsController.revokeSession);
router.delete('/sessions', settingsController.revokeOtherSessions);

export default router;
