import { Achievement } from '../../models/index.js';
import AppError from '../../utils/app-error.js';

export const listAchievements = async (userId) => {
  const achievements = await Achievement.findAll({
    where: { userId },
    order: [['unlocked_at', 'DESC']]
  });
  return achievements;
};

export const unlockUserAchievement = async (userId, achievementKey) => {
  // Verificar se já possui
  const existing = await Achievement.findOne({
    where: { userId, achievementKey }
  });

  if (existing) {
    return existing; // Retorna silenciosamente o existente
  }

  const achievement = await Achievement.create({
    userId,
    achievementKey,
    unlockedAt: new Date()
  });

  return achievement;
};
