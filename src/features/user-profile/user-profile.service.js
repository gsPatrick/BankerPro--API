import { UserProfile } from '../../models/index.js';
import AppError from '../../utils/app-error.js';
import {
  WorkSituations,
  CertificationOptions,
  ExperienceLevels
} from '../../config/constants.js';

const PROFILE_FIELDS = [
  'roleTitle',
  'experienceLevel',
  'bankName',
  'weeklyGoal',
  'workSituation',
  'certification',
  'certificationOther',
  'avatarUrl',
  'onboardingCompleted',
  'onboardingCompletedAt'
];

const enrichWithUser = async (profile) => {
  const resProfile = profile.toJSON();
  const user = await profile.getUser();
  resProfile.whatsapp = user?.whatsapp || null;
  resProfile.fullName = user?.fullName || null;
  resProfile.email = user?.email || null;
  return resProfile;
};

export const getProfileByUserId = async (userId) => {
  const profile = await UserProfile.findOne({ where: { userId } });
  if (!profile) return null;
  return enrichWithUser(profile);
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

  return enrichWithUser(profile);
};

const updateWhatsapp = async (User, userId, whatsapp, Op) => {
  const cleanWhatsapp = whatsapp ? String(whatsapp).replace(/\D/g, '') : null;

  if (cleanWhatsapp) {
    const duplicate = await User.findOne({
      where: {
        whatsapp: cleanWhatsapp,
        id: { [Op.ne]: userId }
      }
    });
    if (duplicate) {
      throw new AppError('Este número de WhatsApp já está cadastrado em outra conta.', 409, 'WHATSAPP_EXISTS');
    }
  }

  await User.update({ whatsapp: cleanWhatsapp }, { where: { id: userId } });
};

export const updateProfile = async (userId, data) => {
  const profile = await UserProfile.findOne({ where: { userId } });
  if (!profile) {
    throw new AppError('Perfil não encontrado para o usuário.', 404, 'PROFILE_NOT_FOUND');
  }

  const User = profile.sequelize.models.User;
  const Op = profile.sequelize.Sequelize.Op;

  if (data.whatsapp !== undefined) {
    await updateWhatsapp(User, userId, data.whatsapp, Op);
  }

  if (data.fullName !== undefined) {
    const fullName = String(data.fullName || '').trim();
    if (!fullName) {
      throw new AppError('O nome é obrigatório.', 400, 'BAD_REQUEST');
    }
    await User.update({ fullName }, { where: { id: userId } });
  }

  if (data.workSituation !== undefined && data.workSituation !== null) {
    if (!Object.values(WorkSituations).includes(data.workSituation)) {
      throw new AppError('Situação atual inválida.', 400, 'BAD_REQUEST');
    }
  }

  if (data.experienceLevel !== undefined && data.experienceLevel !== null) {
    if (!ExperienceLevels.includes(data.experienceLevel)) {
      throw new AppError('Nível de experiência inválido.', 400, 'BAD_REQUEST');
    }
  }

  if (data.certification !== undefined && data.certification !== null) {
    if (!CertificationOptions.includes(data.certification)) {
      throw new AppError('Certificação inválida.', 400, 'BAD_REQUEST');
    }
  }

  if (data.avatarUrl !== undefined && data.avatarUrl) {
    const avatar = String(data.avatarUrl);
    if (avatar.length > 900_000) {
      throw new AppError('A foto de perfil é muito grande. Use uma imagem menor.', 400, 'BAD_REQUEST');
    }
  }

  PROFILE_FIELDS.forEach((field) => {
    if (data[field] !== undefined) {
      profile[field] = data[field];
    }
  });

  if (data.onboardingCompleted === true && !profile.onboardingCompletedAt) {
    profile.onboardingCompletedAt = new Date();
  }

  await profile.save();
  return enrichWithUser(profile);
};

export const completeOnboarding = async (userId, payload) => {
  const {
    fullName,
    whatsapp,
    workSituation,
    bankName,
    roleTitle,
    experienceLevel,
    certification,
    certificationOther,
    avatarUrl
  } = payload;

  if (!fullName || !String(fullName).trim()) {
    throw new AppError('O nome é obrigatório.', 400, 'BAD_REQUEST');
  }

  if (!workSituation || !Object.values(WorkSituations).includes(workSituation)) {
    throw new AppError('A situação atual é obrigatória.', 400, 'BAD_REQUEST');
  }

  const data = {
    fullName: String(fullName).trim(),
    whatsapp: whatsapp ?? null,
    workSituation,
    onboardingCompleted: true,
    onboardingCompletedAt: new Date(),
    avatarUrl: avatarUrl || null
  };

  if (workSituation === WorkSituations.EMPLOYED) {
    if (!bankName || !String(bankName).trim()) {
      throw new AppError('Informe a instituição onde trabalha.', 400, 'BAD_REQUEST');
    }
    if (!roleTitle || !String(roleTitle).trim()) {
      throw new AppError('Informe o cargo/função atual.', 400, 'BAD_REQUEST');
    }
    if (!experienceLevel || !ExperienceLevels.includes(experienceLevel)) {
      throw new AppError('Informe o nível de experiência.', 400, 'BAD_REQUEST');
    }

    data.bankName = String(bankName).trim();
    data.roleTitle = String(roleTitle).trim();
    data.experienceLevel = experienceLevel;
    data.certification = null;
    data.certificationOther = null;
  } else {
    if (!certification || !CertificationOptions.includes(certification)) {
      throw new AppError('Informe a certificação que você está estudando.', 400, 'BAD_REQUEST');
    }
    if (certification === 'Outra' && (!certificationOther || !String(certificationOther).trim())) {
      throw new AppError('Descreva a certificação no campo “Outra”.', 400, 'BAD_REQUEST');
    }

    data.certification = certification;
    data.certificationOther = certification === 'Outra' ? String(certificationOther).trim() : null;
    data.roleTitle = certification === 'Outra'
      ? String(certificationOther).trim()
      : certification;
    data.bankName = null;
    data.experienceLevel = 'Iniciante';
  }

  return updateProfile(userId, data);
};
