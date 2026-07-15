import { UserProfile } from '../../models/index.js';
import AppError from '../../utils/app-error.js';

export const getProfileByUserId = async (userId) => {
  const profile = await UserProfile.findOne({ where: { userId } });
  if (!profile) return null;
  const user = await profile.getUser();
  const resProfile = profile.toJSON();
  resProfile.whatsapp = user?.whatsapp || null;
  return resProfile;
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

  // Se whatsapp for enviado, atualiza no modelo de User
  if (data.whatsapp !== undefined) {
    const User = profile.sequelize.models.User;
    const cleanWhatsapp = data.whatsapp ? data.whatsapp.replace(/\D/g, '') : null;

    if (cleanWhatsapp) {
      const duplicate = await User.findOne({
        where: {
          whatsapp: cleanWhatsapp,
          id: { [profile.sequelize.Sequelize.Op.ne]: userId }
        }
      });
      if (duplicate) {
        throw new AppError('Este número de WhatsApp já está cadastrado em outra conta.', 409, 'WHATSAPP_EXISTS');
      }
    }
    await User.update({ whatsapp: cleanWhatsapp }, { where: { id: userId } });
  }

  // Apenas campos permitidos para atualização direta via form
  const allowedFields = ['roleTitle', 'experienceLevel', 'bankName', 'weeklyGoal'];
  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      profile[field] = data[field];
    }
  });

  await profile.save();

  // Buscar perfil atualizado e incluir whatsapp do usuário no retorno
  const updatedProfile = profile.toJSON();
  const user = await profile.getUser();
  updatedProfile.whatsapp = user?.whatsapp || null;

  return updatedProfile;
};
