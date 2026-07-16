import { Router } from 'express';
import * as goalController from './goal.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/permission.middleware.js';

const router = Router();

router.use(requireAuth);
router.use(requirePermission('metas'));

router.route('/')
  .get(goalController.getGoals)
  .post(goalController.createGoal);

router.route('/:id')
  .put(goalController.updateGoal)
  .delete(goalController.deleteGoal);

export default router;
