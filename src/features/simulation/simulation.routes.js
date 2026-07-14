import { Router } from 'express';
import * as simulationController from './simulation.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { checkSimulationLimit } from '../../middlewares/limit.middleware.js';

const router = Router();

router.use(requireAuth);

router.route('/')
  .get(simulationController.getSimulations)
  .post(checkSimulationLimit, simulationController.createSimulation);

router.route('/:id')
  .get(simulationController.getSimulation)
  .put(simulationController.updateSimulation)
  .patch(simulationController.updateSimulation);

export default router;
