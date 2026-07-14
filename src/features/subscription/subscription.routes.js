import { Router } from 'express';
import * as subscriptionController from './subscription.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

const router = Router();

// Rota pública de webhook
router.post('/webhook', subscriptionController.webhook);

// Rotas autenticadas
router.use(requireAuth);
router.get('/plans', subscriptionController.getPlans);
router.get('/current', subscriptionController.getCurrentSubscription);
router.post('/checkout', subscriptionController.checkout);

export default router;
