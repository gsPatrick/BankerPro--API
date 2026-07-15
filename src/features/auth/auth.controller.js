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

1. Proteção de dados e LGPD
Você deve utilizar a plataforma respeitando a Lei Geral de Proteção de Dados Pessoais. Não insira dados pessoais reais de clientes sem autorização, necessidade legítima e finalidade adequada. Sempre que possível, utilize dados fictícios, anonimizados ou resumidos.

2. Dados sensíveis e sigilosos
É proibido inserir senhas, documentos completos, dados bancários completos, informações médicas, dados sensíveis, prints de sistemas internos, dados de conta, score interno, propostas confidenciais ou qualquer informação protegida por sigilo bancário/comercial.

3. Uso da inteligência artificial
As respostas da IA são sugestões de treinamento e apoio comercial. O usuário deve revisar, adaptar e validar qualquer abordagem antes de usar com clientes reais. A IA pode cometer erros e não deve ser tratada como decisão final.

4. Produtos financeiros permitidos na plataforma
A plataforma foi criada para apoiar negociações de produtos bancários como consórcio, seguro de vida, capitalização, cartão de crédito, empréstimo pessoal, consignado e relacionamento bancário. A plataforma não deve ser usada para recomendação de investimentos, promessa de rentabilidade, promessa de aprovação de crédito ou garantia de contemplação.

5. Conduta comercial responsável
O usuário deve agir com transparência, ética e responsabilidade. É proibido prometer crédito futuro, aprovação garantida, aumento de score, contemplação em consórcio, rentabilidade, vantagem inexistente ou qualquer condição que dependa de análise da instituição financeira.

6. Adequação ao perfil do cliente
Toda abordagem comercial deve considerar o perfil, renda, momento financeiro, capacidade de pagamento, objetivo e necessidade do cliente. O usuário não deve empurrar produtos inadequados, gerar endividamento irresponsável ou omitir informações relevantes.

7. Normas internas e regulatórias
O usuário é responsável por respeitar as normas da instituição onde atua, políticas internas, regras de compliance, LGPD, sigilo bancário, Código de Defesa do Consumidor e boas práticas do mercado financeiro, incluindo diretrizes aplicáveis de entidades como FEBRABAN, ANBIMA e órgãos reguladores quando cabível.

8. Responsabilidade pelo uso
O BankerPro é uma ferramenta de apoio. A responsabilidade pelo atendimento, oferta, comunicação, registro e fechamento comercial é do usuário e/ou da instituição responsável pela operação.`;

  const termsText = await getSettingValue('TERMS_OF_USE_TEXT') || defaultTerms;
  return sendSuccess(res, { terms: termsText }, 'Termos de uso e LGPD obtidos com sucesso.');
});
