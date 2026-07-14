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

// --- SQL ACTIONS ---
router.post('/sql', codexController.executeSql);

export default router;
