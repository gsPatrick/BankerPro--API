import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import * as opportunityController from './commercial-opportunity.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', opportunityController.getOpportunities);
router.get('/:id', opportunityController.getOpportunity);

export default router;
