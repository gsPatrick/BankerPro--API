import { UserProfile } from '../../models/index.js';
import AppError from '../../utils/app-error.js';

export const getProfileByUserId = async (userId) => {
  const profile = await UserProfile.findOne({ where: { userId } });
  return profile;
};

export const listProfiles = async (query = {}) => {
  const where = {};
  if (query.userId) {
    where.userId = query.userId;
  }

  return await UserProfile.findAll({
    where,
    order: [['xpPoints', 'DESC']]
  });
};

export const createProfile = async (userId, data) => {
  const existingProfile = await UserProfile.findOne({ where: { userId } });
  if (existingProfile) {
    throw new AppError('Este usuário já possui um perfil configurado.', 400, 'PROFILE_EXISTS');
  }

  const profile = await UserProfile.create({
    userId,
    ...data
  });

  return profile;
};

export const updateProfile = async (userId, data) => {
  const profile = await UserProfile.findOne({ where: { userId } });
  if (!profile) {
    throw new AppError('Perfil não encontrado para o usuário.', 404, 'PROFILE_NOT_FOUND');
  }

  // Apenas campos permitidos para atualização direta via form
  const allowedFields = ['roleTitle', 'experienceLevel', 'bankName', 'weeklyGoal'];
  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      profile[field] = data[field];
    }
  });

  await profile.save();
  return profile;
};
