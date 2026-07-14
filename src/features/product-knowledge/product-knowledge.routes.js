import { Router } from 'express';
import * as knowledgeController from './product-knowledge.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', knowledgeController.getKnowledge);

export default router;
