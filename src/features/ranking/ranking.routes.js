import { Router } from 'express';
import * as rankingController from './ranking.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', rankingController.getRanking);

export default router;
