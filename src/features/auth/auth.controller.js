import * as authService from './auth.service.js';
import catchAsync from '../../utils/catch-async.js';
import { sendSuccess, sendCreated } from '../../utils/api-response.js';
import AppError from '../../utils/app-error.js';
import { Plan } from '../../models/index.js';
import { getSettingValue } from '../../utils/settings-resolver.js';

export const register = catchAsync(async (req, res, next) => {
  const { email, password, acceptedTerms } = req.body;

  if (!email || !password) {
    return next(new AppError('E-mail e senha são obrigatórios.', 400, 'BAD_REQUEST'));
  }

  const result = await authService.registerUser({ email, password, acceptedTerms });
  return sendCreated(res, result, 'Cadastro realizado com sucesso.');
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

export const getTerms = catchAsync(async (req, res, next) => {
  const defaultTerms = `TERMOS DE USO E POLÍTICA DE PRIVACIDADE (LGPD)

Bem-vindo ao BankerPro! Ao criar uma conta e utilizar nossa plataforma de treinamento de vendas com Inteligência Artificial, você concorda e aceita integralmente as seguintes regras de uso de dados e termos de serviço:

1. Coleta de Dados: Coletamos seu e-mail, nome e dados de progresso das simulações (incluindo gravações/transcrições de áudio e texto) exclusivamente para fins de avaliação pedagógica e geração de relatórios de feedback.
2. LGPD: Seus dados pessoais são processados de acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Garantimos segurança física e digital das informações. Seus dados nunca serão compartilhados com terceiros sem consentimento explícito.
3. Propriedade Intelectual: Todo o conteúdo gerado pela IA (personas, cenários e feedbacks de avaliação) é propriedade do BankerPro.
4. Uso Permitido: O acesso é individual e intransferível. Qualquer uso automatizado ou tentativa de scraping é proibida.

Se você tiver dúvidas, entre em contato com o suporte em contato@bankerpro.com.`;

  const termsText = await getSettingValue('TERMS_OF_USE_TEXT') || defaultTerms;
  return sendSuccess(res, { terms: termsText }, 'Termos de uso e LGPD obtidos com sucesso.');
});
