import { Router } from 'express';
import * as subscriptionController from './subscription.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

const router = Router();

// Rotas públicas
router.post('/webhook', subscriptionController.webhook);
router.get('/plans', subscriptionController.getPlans);
router.get('/checkout-config', subscriptionController.getCheckoutConfig);

// Rotas autenticadas
router.use(requireAuth);
router.get('/current', subscriptionController.getCurrentSubscription);
router.get('/payment/:paymentId', subscriptionController.getPaymentStatus);
router.post('/checkout', subscriptionController.checkout);

export default router;
