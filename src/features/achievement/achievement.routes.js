import { Router } from 'express';
import * as achievementController from './achievement.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.route('/')
  .get(achievementController.getAchievements)
  .post(achievementController.unlockAchievement);

export default router;
