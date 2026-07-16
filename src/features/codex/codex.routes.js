import { Router } from 'express';
import * as codexController from './codex.controller.js';
import { verifyCodexToken } from './codex.middleware.js';

const router = Router();

// Todas as rotas do Codex exigem verificação do token secreto
router.use(verifyCodexToken);

// --- PING CONNECTION TEST ---
router.get('/ping', codexController.ping);

// --- SCENARIOS ---
router.route('/scenarios')
  .get(codexController.listScenarios)
  .post(codexController.createScenario);

router.route('/scenarios/:id')
  .put(codexController.updateScenario)
  .delete(codexController.deleteScenario);

// --- PLANOS ---
// Precisa vir antes de /plans/:id, senão "features" cairia no parâmetro de id.
router.get('/plans/features', codexController.listPlanFeatures);

router.route('/plans')
  .get(codexController.listPlans)
  .post(codexController.createPlan);

router.route('/plans/:id')
  .put(codexController.updatePlan)
  .delete(codexController.deletePlan);

// --- PROMPTS ---
router.route('/prompts')
  .get(codexController.listPrompts);

router.route('/prompts/:key')
  .put(codexController.updatePrompt);

// --- SYSTEM SETTINGS ---
router.route('/settings')
  .get(codexController.listSettings)
  .post(codexController.saveSetting);

// --- PRODUCT KNOWLEDGE (COPILOT BASE) ---
router.route('/knowledge')
  .get(codexController.listKnowledge)
  .post(codexController.createKnowledge);

router.route('/knowledge/:id')
  .put(codexController.updateKnowledge)
  .delete(codexController.deleteKnowledge);

// --- COMMERCIAL OPPORTUNITIES ---
router.route('/opportunities')
  .get(codexController.listOpportunities)
  .post(codexController.createOpportunity);

router.route('/opportunities/:id')
  .put(codexController.updateOpportunity)
  .delete(codexController.deleteOpportunity);

// --- TERMS OF USE ---
router.route('/terms')
  .get(codexController.getTerms)
  .put(codexController.updateTerms);

// --- WHATSAPP CONTROL ---
router.get('/whatsapp/status', codexController.getWhatsappStatus);
router.post('/whatsapp/connect', codexController.connectWhatsapp);
router.post('/whatsapp/disconnect', codexController.disconnectWhatsapp);

// --- SQL ACTIONS ---
router.post('/sql', codexController.executeSql);

export default router;
