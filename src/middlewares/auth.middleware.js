import jwt from 'jsonwebtoken';
import { User, UserProfile, Subscription } from '../models/index.js';
import AppError from '../utils/app-error.js';
import catchAsync from '../utils/catch-async.js';

export const requireAuth = catchAsync(async (req, res, next) => {
  let token;

  // 1) Obter token dos headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Você não está autenticado. Por favor, faça login.', 401, 'AUTH_REQUIRED'));
  }

  // 2) Validar token
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_bankerpro_change_me_in_production');

  // 3) Verificar se o usuário ainda existe
  const currentUser = await User.findByPk(decoded.id, {
    include: [
      { model: UserProfile, as: 'profile' },
      { 
        model: Subscription, 
        as: 'subscriptions',
        where: { status: 'active' },
        required: false
      }
    ]
  });

  if (!currentUser) {
    return next(new AppError('O usuário dono deste token não existe mais.', 401, 'USER_NOT_FOUND'));
  }

  // 4) Verificar se a conta do usuário está ativa
  if (!currentUser.isActive) {
    return next(new AppError('Sua conta foi desativada pelo administrador.', 403, 'ACCOUNT_DEACTIVATED'));
  }

  // 5) Garantir que o email esteja verificado (opcional para rotas específicas, mas padrão para operações)
  if (!currentUser.emailVerified) {
    return next(new AppError('Por favor, confirme seu e-mail antes de prosseguir.', 403, 'EMAIL_NOT_VERIFIED'));
  }

  // Gravar usuário na requisição
  req.user = currentUser;
  next();
});

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Você não tem permissão para realizar esta ação.', 403, 'PERMISSION_DENIED'));
    }
    next();
  };
};
