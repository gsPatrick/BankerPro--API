import { Router } from 'express';
import * as rankingController from './ranking.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/permission.middleware.js';

const router = Router();

router.use(requireAuth);
router.use(requirePermission('ranking'));

router.get('/', rankingController.getRanking);

export default router;
