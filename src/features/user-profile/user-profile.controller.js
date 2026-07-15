import * as profileService from './user-profile.service.js';
import catchAsync from '../../utils/catch-async.js';
import { sendSuccess, sendCreated } from '../../utils/api-response.js';
import AppError from '../../utils/app-error.js';

export const getProfile = catchAsync(async (req, res, next) => {
  const isPlural = req.baseUrl.endsWith('profiles') ||
                   req.baseUrl.endsWith('user-profiles') ||
                   Object.keys(req.query).length > 0;

  if (isPlural) {
    const list = await profileService.listProfiles(req.query);
    return sendSuccess(res, list, 'Lista de perfis de usuários.');
  }

  const profile = await profileService.getProfileByUserId(req.user.id);
  if (!profile) {
    return next(new AppError('Perfil não configurado.', 404, 'PROFILE_NOT_FOUND'));
  }

  return sendSuccess(res, profile, 'Perfil do usuário.');
});

export const createProfile = catchAsync(async (req, res, next) => {
  const { roleTitle, experienceLevel, bankName, weeklyGoal } = req.body;

  if (!roleTitle) {
    return next(new AppError('A função (roleTitle) é obrigatória.', 400, 'BAD_REQUEST'));
  }

  const profile = await profileService.createProfile(req.user.id, {
    roleTitle,
    experienceLevel,
    bankName,
    weeklyGoal,
    onboardingCompleted: false
  });

  return sendCreated(res, profile, 'Perfil criado com sucesso.');
});

export const updateProfile = catchAsync(async (req, res) => {
  const profile = await profileService.updateProfile(req.user.id, req.body);
  return sendSuccess(res, profile, 'Perfil atualizado com sucesso.');
});

export const completeOnboarding = catchAsync(async (req, res) => {
  const profile = await profileService.completeOnboarding(req.user.id, req.body);
  return sendSuccess(res, profile, 'Onboarding concluído com sucesso.');
});
