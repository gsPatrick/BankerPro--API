import { Router } from 'express';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';

// Import controllers
import * as adminPromptsController from './controllers/admin-prompts.controller.js';
import * as adminScenariosController from './controllers/admin-scenarios.controller.js';
import * as adminPlansController from './controllers/admin-plans.controller.js';
import * as adminKnowledgeController from './controllers/admin-knowledge.controller.js';
import * as adminUsersController from './controllers/admin-users.controller.js';
import * as adminSettingsController from './controllers/admin-settings.controller.js';
import * as adminAgentController from './controllers/admin-agent.controller.js';

const router = Router();

// Garantir que todos os acessos ao painel admin exijam autenticação e perfil de admin
router.use(requireAuth, requireRole('admin'));

// --- SCENARIO MANAGEMENT ---
router.route('/scenarios')
  .get(adminScenariosController.getScenarios)
  .post(adminScenariosController.createScenario);

router.route('/scenarios/:id')
  .put(adminScenariosController.updateScenario)
  .delete(adminScenariosController.deleteScenario);

// --- KNOWLEDGE BASE MANAGEMENT ---
router.route('/knowledge')
  .get(adminKnowledgeController.getKnowledge)
  .post(adminKnowledgeController.createKnowledge);

router.route('/knowledge/:id')
  .delete(adminKnowledgeController.deleteKnowledge);

// --- PROMPTS MANAGEMENT ---
router.route('/prompts')
  .get(adminPromptsController.getPrompts);

router.route('/prompts/:key')
  .put(adminPromptsController.updatePrompt);

router.post('/prompts/test', adminPromptsController.testPrompt);

// --- PLANS MANAGEMENT ---
router.route('/plans')
  .get(adminPlansController.getPlans)
  .post(adminPlansController.createPlan);

router.route('/plans/:id')
  .put(adminPlansController.updatePlan)
  .delete(adminPlansController.deletePlan);

// --- SETTINGS MANAGEMENT ---
router.route('/settings')
  .get(adminSettingsController.getSettings)
  .post(adminSettingsController.saveSetting);

// --- USER & SUBSCRIPTION MANAGEMENT ---
router.route('/users')
  .get(adminUsersController.getUsers);

router.route('/users/:id')
  .delete(adminUsersController.deleteUser);

router.put('/users/:id/role', adminUsersController.updateUserRole);
router.put('/users/:id/status', adminUsersController.updateUserStatus);
router.post('/users/:id/subscription', adminUsersController.manualSubscription);

// --- AI AGENT RUNNER ---
router.post('/ai-agent/run', adminAgentController.runAgentCommand);

export default router;
