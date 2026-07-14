import * as achievementService from './achievement.service.js';
import catchAsync from '../../utils/catch-async.js';
import { sendSuccess, sendCreated } from '../../utils/api-response.js';
import AppError from '../../utils/app-error.js';

export const getAchievements = catchAsync(async (req, res, next) => {
  const achievements = await achievementService.listAchievements(req.user.id);
  return sendSuccess(res, achievements, 'Conquistas desbloqueadas do usuário.');
});

export const unlockAchievement = catchAsync(async (req, res, next) => {
  const { achievementKey } = req.body;

  if (!achievementKey) {
    return next(new AppError('A chave da conquista (achievementKey) é obrigatória.', 400, 'BAD_REQUEST'));
  }

  const achievement = await achievementService.unlockUserAchievement(req.user.id, achievementKey);
  return sendCreated(res, achievement, 'Conquista desbloqueada com sucesso.');
});
