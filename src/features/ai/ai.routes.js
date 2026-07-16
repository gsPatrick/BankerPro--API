import { Router } from 'express';
import * as aiController from './ai.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/permission.middleware.js';

const router = Router();

router.use(requireAuth);

router.post('/simulation/chat', requirePermission('cenarios'), aiController.simulationChat);
router.post('/simulation/evaluate', requirePermission('cenarios'), aiController.simulationEvaluate);
router.post('/simulation/extract-learning', requirePermission('cenarios'), aiController.simulationExtractLearning);
router.post('/copiloto/analyze', requirePermission('copiloto'), aiController.copilotoAnalyze);
router.post('/approach/generate', requirePermission('gerador'), aiController.approachGenerate);
router.post('/knowledge/polish', requireRole('admin'), aiController.knowledgePolish);
router.post('/invoke-llm', aiController.invokeLLM);

export default router;
