import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, EmailOtp, UserProfile } from '../../models/index.js';
import { JWT_SECRET } from '../../config/secrets.js';
import AppError from '../../utils/app-error.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../email/email.service.js';

const generateToken = (userId, tokenVersion = 0) => {
  // Sessão infinita: o token NÃO expira (sem claim `exp`). O usuário só sai da conta
  // ao fazer logout manualmente, que apaga o token no dispositivo. Por isso não
  // passamos `expiresIn` — o JWT_EXPIRES_IN do ambiente é ignorado de propósito.
  //
  // Como não há expiração, precisa existir uma forma de invalidar: o `tv` carrega
  // a geração da sessão, conferida a cada requisição. Redefinir a senha ou
  // encerrar as outras sessões incrementa esse número no banco e derruba na hora
  // todos os tokens antigos.
  return jwt.sign({ id: userId, tv: tokenVersion }, JWT_SECRET);
};

// OTP com gerador criptográfico. Math.random() é previsível: quem observa alguns
// códigos consegue prever os próximos — e este código redefine senha.
const gerarOtp = () => String(crypto.randomInt(100000, 1000000));

/**
 * Invalida todas as sessões do usuário e devolve um token novo para o aparelho
 * que pediu a operação — que assim continua logado enquanto os outros caem.
 *
 * É o que faz "encerrar sessão" valer de verdade: apagar a linha do banco não
 * tirava ninguém, porque o token do outro aparelho seguia sendo aceito.
 */
export const rotateSessionsAndIssueToken = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('Usuário não encontrado.', 404, 'USER_NOT_FOUND');
  }
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
  return generateToken(user.id, user.tokenVersion);
};

export const registerUser = async ({ email, password, acceptedTerms, fullName, whatsapp }) => {
  // 0) Validar aceite de termos e LGPD
  if (acceptedTerms !== true && acceptedTerms !== 'true') {
    throw new AppError('Você precisa concordar com os Termos de Uso e Políticas de Privacidade (LGPD).', 400, 'TERMS_NOT_ACCEPTED');
  }

  // 0.5) Exigência mínima de senha. O cadastro não tinha nenhuma — dava para
  // criar conta com senha de 1 caractere, que cai em qualquer teste de força
  // bruta. O reset de senha já cobrava um mínimo; agora as duas portas cobram.
  if (!password || String(password).length < 8) {
    throw new AppError('A senha deve ter no mínimo 8 caracteres.', 400, 'WEAK_PASSWORD');
  }

  // 1) Verificar se o e-mail já existe
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new AppError('Este e-mail já está cadastrado.', 409, 'EMAIL_EXISTS');
  }

  // 2) Hashing da senha
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // 3) Criar usuário (Auto-verificado temporariamente)
  const user = await User.create({
    email,
    passwordHash,
    role: 'user',
    emailVerified: true,
    acceptedTermsAt: new Date(),
    fullName,
    whatsapp
  });

  // 3.5) Perfil base — onboarding preenche os dados reais depois
  await UserProfile.findOrCreate({
    where: { userId: user.id },
    defaults: {
      roleTitle: 'Não informado',
      experienceLevel: 'Iniciante',
      bankName: null,
      onboardingCompleted: false,
      weeklyGoal: 5,
      weeklyCompleted: 0,
      totalSimulations: 0,
      averageScore: 0.0,
      bestScore: 0.0,
      streakDays: 0,
      xpPoints: 0,
      lastActiveDate: null
    }
  });

  const accessToken = generateToken(user.id, user.tokenVersion || 0);

  // Boas-vindas: dispara sem travar o cadastro. Se o e-mail falhar, o usuário já
  // está criado e autenticado — o erro fica só no log.
  sendWelcomeEmail({ to: user.email, fullName: user.fullName }).catch((err) => {
    console.error('Falha ao enviar e-mail de boas-vindas:', err?.message || err);
  });

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    onboardingCompleted: false,
    accessToken
  };
};

export const verifyUserOtp = async ({ email, otpCode }) => {
  // 1) Encontrar OTP ativo
  const otpRecord = await EmailOtp.findOne({
    where: {
      email,
      otpCode,
      used: false
    },
    order: [['created_at', 'DESC']]
  });

  if (!otpRecord) {
    throw new AppError('Código OTP inválido.', 400, 'INVALID_OTP');
  }

  // 2) Verificar expiração
  if (new Date() > new Date(otpRecord.expiresAt)) {
    throw new AppError('O código OTP expirou. Solicite um novo código.', 400, 'OTP_EXPIRED');
  }

  // 3) Marcar como usado e confirmar email do usuário
  otpRecord.used = true;
  await otpRecord.save();

  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new AppError('Usuário não encontrado.', 404, 'USER_NOT_FOUND');
  }

  user.emailVerified = true;
  await user.save();

  // 3.5) Perfil base — onboarding preenche os dados reais depois
  await UserProfile.findOrCreate({
    where: { userId: user.id },
    defaults: {
      roleTitle: 'Não informado',
      experienceLevel: 'Iniciante',
      bankName: null,
      onboardingCompleted: false,
      weeklyGoal: 5,
      weeklyCompleted: 0,
      totalSimulations: 0,
      averageScore: 0.0,
      bestScore: 0.0,
      streakDays: 0,
      xpPoints: 0
    }
  });

  const profile = await UserProfile.findOne({ where: { userId: user.id } });

  // 4) Gerar JWT
  const token = generateToken(user.id, user.tokenVersion || 0);

  return {
    access_token: token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      onboardingCompleted: Boolean(profile?.onboardingCompleted),
      avatarUrl: profile?.avatarUrl || null
    }
  };
};

export const resendUserOtp = async (email) => {
  // Resposta igual para e-mail sem conta e para e-mail já verificado: antes, a
  // diferença entre "usuário não encontrado" e "já verificado" permitia varrer
  // uma lista de e-mails e descobrir quais têm conta aqui — o mesmo cuidado que
  // o "esqueci minha senha" já tomava.
  const respostaGenerica = { message: 'Se este e-mail precisar de verificação, enviaremos um novo código.' };

  const user = await User.findOne({ where: { email } });
  if (!user || user.emailVerified) {
    return respostaGenerica;
  }

  // 2) Inutilizar OTPs anteriores
  await EmailOtp.update({ used: true }, { where: { email, used: false } });

  // 3) Gerar novo OTP
  const otpCode = gerarOtp();
  const expiresAt = new Date(Date.now() + 10 * 60000);

  await EmailOtp.create({
    email,
    otpCode,
    expiresAt,
    used: false
  });

  // O código NÃO vai para o log fora de desenvolvimento. Quem tiver acesso aos
  // logs do deploy (painel, agregador, um print em suporte) tomaria qualquer
  // conta: pede o reenvio, lê o código no log e confirma.
  if (process.env.NODE_ENV !== 'production' && process.env.LOG_OTP === 'true') {
    console.log(`📧 [DEV] Novo código para ${email}: ${otpCode}`);
  } else {
    console.log(`📧 Código de verificação reenviado para ${email}.`);
  }

  return respostaGenerica;
};

export const loginUser = async ({ email, password }) => {
  // 1) Encontrar usuário
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new AppError('E-mail ou senha inválidos.', 401, 'INVALID_CREDENTIALS');
  }

  // 2) Validar senha
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError('E-mail ou senha inválidos.', 401, 'INVALID_CREDENTIALS');
  }

  // 3) Verificar se o e-mail foi confirmado
  if (!user.emailVerified) {
    throw new AppError('Seu e-mail ainda não foi verificado. Por favor, insira o código OTP enviado.', 403, 'EMAIL_NOT_VERIFIED');
  }

  // 4) Gerar token + status de onboarding
  const token = generateToken(user.id, user.tokenVersion || 0);
  const profile = await UserProfile.findOne({ where: { userId: user.id } });

  return {
    access_token: token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      whatsapp: user.whatsapp,
      onboardingCompleted: Boolean(profile?.onboardingCompleted),
      avatarUrl: profile?.avatarUrl || null
    }
  };
};

/**
 * Passo 1 do "esqueci minha senha": gera um código OTP, guarda e envia por
 * e-mail. Não revela se o e-mail existe — responde igual em qualquer caso, para
 * não virar um oráculo de quais e-mails têm conta (enumeração).
 */
export const requestPasswordReset = async (email) => {
  const respostaGenerica = { message: 'Se este e-mail tiver uma conta, enviaremos um código de redefinição.' };

  const user = await User.findOne({ where: { email } });
  if (!user) {
    console.log(`ℹ️ Pedido de reset para e-mail sem conta: ${email} — ignorado silenciosamente.`);
    return respostaGenerica;
  }

  // Invalida OTPs anteriores deste e-mail antes de gerar o novo.
  await EmailOtp.update({ used: true }, { where: { email, used: false } });

  const otpCode = gerarOtp();
  const expiresMinutes = 10;
  const expiresAt = new Date(Date.now() + expiresMinutes * 60000);

  await EmailOtp.create({ email, otpCode, expiresAt, used: false });

  await sendPasswordResetEmail({
    to: user.email,
    fullName: user.fullName,
    code: otpCode,
    expiresMinutes
  });

  console.log(`🔑 Código de reset de senha gerado para ${email}.`);
  return respostaGenerica;
};

/**
 * Passo 2: valida o código e troca a senha. Consome o OTP no sucesso.
 */
export const resetPassword = async ({ email, otpCode, newPassword }) => {
  if (!newPassword || String(newPassword).length < 6) {
    throw new AppError('A nova senha deve ter no mínimo 6 caracteres.', 400, 'WEAK_PASSWORD');
  }

  const otpRecord = await EmailOtp.findOne({
    where: { email, otpCode: String(otpCode).trim(), used: false },
    order: [['created_at', 'DESC']]
  });

  if (!otpRecord) {
    throw new AppError('Código inválido. Solicite um novo código de redefinição.', 400, 'INVALID_OTP');
  }

  if (new Date() > new Date(otpRecord.expiresAt)) {
    throw new AppError('O código expirou. Solicite um novo código de redefinição.', 400, 'OTP_EXPIRED');
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new AppError('Usuário não encontrado.', 404, 'USER_NOT_FOUND');
  }

  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(newPassword, salt);
  // Se a conta ainda não tinha e-mail verificado, redefinir a senha pelo código
  // enviado ao próprio e-mail já prova a posse dele.
  user.emailVerified = true;
  // Derruba todas as sessões abertas. É o ponto central da redefinição de senha:
  // quem redefine normalmente está reagindo a um acesso indevido, e sem isto o
  // invasor continuava logado com o token antigo mesmo depois da troca.
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();

  // Consome o código e limpa os demais deste e-mail.
  otpRecord.used = true;
  await otpRecord.save();
  await EmailOtp.update({ used: true }, { where: { email, used: false } });

  console.log(`✅ Senha redefinida com sucesso para ${email}.`);
  return { message: 'Senha redefinida com sucesso. Faça login com a nova senha.' };
};

export const listUsersPublic = async () => {
  return await User.findAll({
    attributes: ['id', 'email', 'fullName'],
    order: [['created_at', 'DESC']]
  });
};
