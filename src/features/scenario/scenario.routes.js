import { Router } from 'express';
import * as scenarioController from './scenario.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', scenarioController.getScenarios);
router.get('/:id', scenarioController.getScenario);

export default router;
