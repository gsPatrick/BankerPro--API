import { Router } from 'express';
import * as aiController from './ai.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/permission.middleware.js';
import { enforceLimit } from '../../middlewares/limit.middleware.js';
import { aiRateLimit } from '../../middlewares/rate-limit.middleware.js';

const router = Router();

router.use(requireAuth);
// Teto por usuário nas chamadas de IA — protege a fatura e a máquina de loops.
router.use(aiRateLimit);

router.post('/simulation/chat', requirePermission('cenarios'), aiController.simulationChat);
router.post('/simulation/evaluate', requirePermission('cenarios'), aiController.simulationEvaluate);
router.post('/simulation/extract-learning', requirePermission('cenarios'), aiController.simulationExtractLearning);
router.post('/copiloto/analyze', requirePermission('copiloto'), enforceLimit('copiloto'), aiController.copilotoAnalyze);
router.post('/approach/generate', requirePermission('gerador'), enforceLimit('gerador'), aiController.approachGenerate);
router.post('/knowledge/polish', requireRole('admin'), aiController.knowledgePolish);

// Prompt livre direto no Claude. Estava aberto a qualquer conta autenticada, sem
// exigir plano: um cadastro grátis usava a plataforma como LLM ilimitada e a
// conta da Anthropic pagava. As telas do produto não chamam esta rota — elas têm
// endpoints próprios acima —, então ela fica restrita ao admin.
router.post('/invoke-llm', requireRole('admin'), aiController.invokeLLM);

export default router;
