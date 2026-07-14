import * as authService from './auth.service.js';
import catchAsync from '../../utils/catch-async.js';
import { sendSuccess, sendCreated } from '../../utils/api-response.js';
import AppError from '../../utils/app-error.js';
import { Plan } from '../../models/index.js';

export const register = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('E-mail e senha são obrigatórios.', 400, 'BAD_REQUEST'));
  }

  const result = await authService.registerUser({ email, password });
  return sendCreated(res, result, 'Cadastro realizado com sucesso. Um código de verificação foi enviado para seu e-mail.');
});

export const verifyOtp = catchAsync(async (req, res, next) => {
  const { email, otpCode } = req.body;

  if (!email || !otpCode) {
    return next(new AppError('E-mail e código OTP são obrigatórios.', 400, 'BAD_REQUEST'));
  }

  const result = await authService.verifyUserOtp({ email, otpCode });
  return sendSuccess(res, result, 'E-mail verificado com sucesso.');
});

export const resendOtp = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError('E-mail é obrigatório.', 400, 'BAD_REQUEST'));
  }

  const result = await authService.resendUserOtp(email);
  return sendSuccess(res, result, 'Novo código OTP enviado.');
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('E-mail e senha são obrigatórios.', 400, 'BAD_REQUEST'));
  }

  const result = await authService.loginUser({ email, password });
  return sendSuccess(res, result, 'Autenticado com sucesso.');
});

export const getMe = catchAsync(async (req, res, next) => {
  const user = req.user;
  
  // Buscar a assinatura ativa do usuário
  const activeSub = user.subscriptions?.[0];
  const planKey = activeSub ? activeSub.plan : 'free';
  const plan = await Plan.findOne({ where: { key: planKey } });

  return sendSuccess(res, {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    profile: user.profile,
    plan: planKey,
    permissions: plan ? plan.permissions : ['simulations', 'biblioteca']
  }, 'Dados do usuário autenticado.');
});

export const getUsersList = catchAsync(async (req, res, next) => {
  const users = await authService.listUsersPublic();
  return sendSuccess(res, users, 'Lista pública de usuários.');
});
