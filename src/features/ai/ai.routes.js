import { Router } from 'express';
import * as aiController from './ai.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.post('/simulation/chat', aiController.simulationChat);
router.post('/simulation/evaluate', aiController.simulationEvaluate);
router.post('/simulation/extract-learning', aiController.simulationExtractLearning);
router.post('/copiloto/analyze', aiController.copilotoAnalyze);
router.post('/approach/generate', aiController.approachGenerate);
router.post('/knowledge/polish', requireRole('admin'), aiController.knowledgePolish);
router.post('/invoke-llm', aiController.invokeLLM);

export default router;
