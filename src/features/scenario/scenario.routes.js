import { Router } from 'express';
import * as scenarioController from './scenario.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/permission.middleware.js';

const router = Router();

router.use(requireAuth);
router.use(requirePermission('cenarios'));

router.get('/', scenarioController.getScenarios);
router.get('/:id', scenarioController.getScenario);

export default router;
