import { Router } from 'express';
import authRoutes from '../features/auth/auth.routes.js';
import userProfileRoutes from '../features/user-profile/user-profile.routes.js';
import clientRoutes from '../features/client/client.routes.js';
import goalRoutes from '../features/goal/goal.routes.js';
import noteRoutes from '../features/note/note.routes.js';
import scenarioRoutes from '../features/scenario/scenario.routes.js';
import simulationRoutes from '../features/simulation/simulation.routes.js';
import rankingRoutes from '../features/ranking/ranking.routes.js';
import achievementRoutes from '../features/achievement/achievement.routes.js';
import aiRoutes from '../features/ai/ai.routes.js';
import subscriptionRoutes from '../features/subscription/subscription.routes.js';
import settingsRoutes from '../features/settings/settings.routes.js';
import productKnowledgeRoutes from '../features/product-knowledge/product-knowledge.routes.js';
import commercialOpportunityRoutes from '../features/commercial-opportunity/commercial-opportunity.routes.js';
import adminRoutes from '../features/admin/admin.routes.js';
import codexRoutes from '../features/codex/codex.routes.js';
import whatsappRoutes from '../features/whatsapp/whatsapp.routes.js';
import uploadRoutes from '../features/upload/upload.routes.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import * as authController from '../features/auth/auth.controller.js';
import * as aiController from '../features/ai/ai.controller.js';

const router = Router();

// Montar sub-rotas com aliases de pluralização/singularidade para compatibilidade com o front
router.use('/auth', authRoutes);
router.get('/users', requireAuth, authController.getUsersList);
router.get('/user', requireAuth, authController.getUsersList);

router.post('/integrations/core/invoke-llm', requireAuth, aiController.invokeLLM);
router.post('/integrations/core/invoke_llm', requireAuth, aiController.invokeLLM);

router.use('/profile', userProfileRoutes);
router.use('/profiles', userProfileRoutes);
router.use('/user-profiles', userProfileRoutes);

router.use('/clients', clientRoutes);
router.use('/client', clientRoutes);

router.use('/goals', goalRoutes);
router.use('/goal', goalRoutes);

router.use('/notes', noteRoutes);
router.use('/quick-notes', noteRoutes);
router.use('/note', noteRoutes);
router.use('/quick-note', noteRoutes);

router.use('/scenarios', scenarioRoutes);
router.use('/scenario', scenarioRoutes);

router.use('/simulations', simulationRoutes);
router.use('/simulation', simulationRoutes);

router.use('/ranking', rankingRoutes);

router.use('/achievements', achievementRoutes);
router.use('/achievement', achievementRoutes);

router.use('/ai', aiRoutes);

router.use('/subscription', subscriptionRoutes);
router.use('/subscriptions', subscriptionRoutes);

router.use('/settings', settingsRoutes);
router.use('/configuracoes', settingsRoutes);

router.use('/product-knowledge', productKnowledgeRoutes);
router.use('/product-knowledges', productKnowledgeRoutes);

router.use('/commercial-opportunities', commercialOpportunityRoutes);
router.use('/commercial-opportunity', commercialOpportunityRoutes);
router.use('/opportunities', commercialOpportunityRoutes);
router.use('/opportunity', commercialOpportunityRoutes);

router.use('/admin', adminRoutes);
router.use('/codex', codexRoutes);
router.use('/whatsapp', whatsappRoutes);
router.use('/upload', uploadRoutes);

// Endpoint de ping para testes de conectividade / healthchecks
router.get('/ping', (req, res) => {
  res.json({
    status: 'success',
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

// Endpoint de health check geral
router.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

export default router;
