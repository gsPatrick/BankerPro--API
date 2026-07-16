import { Router } from 'express';
import * as simulationController from './simulation.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/permission.middleware.js';
import { checkSimulationLimit } from '../../middlewares/limit.middleware.js';

const router = Router();

router.use(requireAuth);

// O gate aqui é por rota, não no router: listar é o Histórico, criar é iniciar
// uma simulação a partir dos Cenários.
router.route('/')
  .get(requirePermission('historico'), simulationController.getSimulations)
  .post(requirePermission('cenarios'), checkSimulationLimit, simulationController.createSimulation);

// Uma simulação específica é aberta tanto durante o treino quanto ao rever o
// resultado pelo Histórico.
router.route('/:id')
  .get(requirePermission('cenarios', 'historico'), simulationController.getSimulation)
  .put(requirePermission('cenarios', 'historico'), simulationController.updateSimulation)
  .patch(requirePermission('cenarios', 'historico'), simulationController.updateSimulation);

export default router;
