import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, EmailOtp, UserProfile } from '../../models/index.js';
import AppError from '../../utils/app-error.js';

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'super_secret_jwt_key_bankerpro_change_me_in_production',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

export const registerUser = async ({ email, password }) => {
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
    emailVerified: true
  });

  // 3.5) Garantir a criação automática de UserProfile padrão de imediato
  await UserProfile.findOrCreate({
    where: { userId: user.id },
    defaults: {
      roleTitle: 'Assistente Comercial',
      experienceLevel: 'Iniciante',
      bankName: 'Banco do Brasil',
      weeklyGoal: 5,
      weeklyCompleted: 0,
      totalSimulations: 0,
      averageScore: 0.0,
      bestScore: 0.0,
      streakDays: 0,
      experiencePoints: 0,
      lastSimulationDate: null
    }
  });

  const accessToken = generateToken(user.id);

  return {
    id: user.id,
    email: user.email,
    role: user.role,
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

  // 3.5) Garantir a criação automática de UserProfile padrão para o novo usuário
  await UserProfile.findOrCreate({
    where: { userId: user.id },
    defaults: {
      roleTitle: 'Assistente Comercial',
      experienceLevel: 'Iniciante',
      bankName: 'Banco do Brasil',
      weeklyGoal: 5,
      weeklyCompleted: 0,
      totalSimulations: 0,
      averageScore: 0.0,
      bestScore: 0.0,
      streakDays: 0,
      xpPoints: 0
    }
  });

  // 4) Gerar JWT
  const token = generateToken(user.id);

  return {
    access_token: token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role
    }
  };
};

export const resendUserOtp = async (email) => {
  // 1) Encontrar usuário
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new AppError('Usuário não encontrado.', 404, 'USER_NOT_FOUND');
  }

  if (user.emailVerified) {
    throw new AppError('Este e-mail já está verificado.', 400, 'EMAIL_ALREADY_VERIFIED');
  }

  // 2) Inutilizar OTPs anteriores
  await EmailOtp.update({ used: true }, { where: { email, used: false } });

  // 3) Gerar novo OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60000);

  await EmailOtp.create({
    email,
    otpCode,
    expiresAt,
    used: false
  });

  console.log(`\n=================================================`);
  console.log(`📧 [DEV OTP RESEND] Novo código para ${email}: ${otpCode}`);
  console.log(`=================================================\n`);

  return { message: 'OTP reenviado com sucesso.' };
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

  // 4) Gerar token
  const token = generateToken(user.id);

  return {
    access_token: token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role
    }
  };
};

export const listUsersPublic = async () => {
  return await User.findAll({
    attributes: ['id', 'email', 'fullName'],
    order: [['created_at', 'DESC']]
  });
};
