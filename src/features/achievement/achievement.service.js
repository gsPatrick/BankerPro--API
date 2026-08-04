import { Achievement } from '../../models/index.js';
import AppError from '../../utils/app-error.js';

export const listAchievements = async (userId) => {
  const achievements = await Achievement.findAll({
    where: { userId },
    order: [['unlocked_at', 'DESC']]
  });
  return achievements;
};

// Formato e teto de conquistas por conta. O endpoint aceita a chave que o
// cliente mandar, então sem isto um script grava linhas ilimitadas com chaves
// aleatórias — vira crescimento de tabela por conta de qualquer usuário. O
// índice único é por (usuário, chave), então basta variar a chave para escapar
// dele.
const FORMATO_CHAVE = /^[a-z0-9][a-z0-9_-]{0,63}$/i;
const MAXIMO_POR_USUARIO = 200;

export const unlockUserAchievement = async (userId, achievementKey) => {
  const chave = String(achievementKey).trim();

  if (!FORMATO_CHAVE.test(chave)) {
    throw new AppError('Chave de conquista inválida.', 400, 'INVALID_ACHIEVEMENT_KEY');
  }

  const total = await Achievement.count({ where: { userId } });
  if (total >= MAXIMO_POR_USUARIO) {
    throw new AppError('Limite de conquistas atingido.', 429, 'ACHIEVEMENT_LIMIT_REACHED');
  }

  achievementKey = chave;

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
