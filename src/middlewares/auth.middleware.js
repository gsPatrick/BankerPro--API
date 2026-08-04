import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { User, UserProfile, Subscription } from '../models/index.js';
import { JWT_SECRET } from '../config/secrets.js';
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
  // Algoritmo fixado: sem isto, a validação aceita qualquer algoritmo que a
  // biblioteca suporte para um segredo simétrico. Declarar o esperado fecha a
  // classe de ataque de "confusão de algoritmo", em que o token diz como quer
  // ser verificado.
  const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });

  // 3) Verificar se o usuário ainda existe
  const currentUser = await User.findByPk(decoded.id, {
    include: [
      { model: UserProfile, as: 'profile' },
      {
        model: Subscription,
        as: 'subscriptions',
        // Vencida não conta: um trial expirado deixa de liberar as telas.
        where: { status: 'active', [Op.or]: [{ endsAt: null }, { endsAt: { [Op.gt]: new Date() } }] },
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

  // 6) Conferir a geração da sessão. Como o token não expira, este é o único
  // jeito de invalidá-lo: redefinir a senha ou encerrar as outras sessões
  // incrementa o tokenVersion do usuário, e todo token emitido antes cai aqui.
  // Antes disso, quem tivesse roubado uma sessão continuava dentro mesmo depois
  // de a vítima trocar a senha.
  if ((decoded.tv ?? 0) !== (currentUser.tokenVersion ?? 0)) {
    return next(new AppError('Sua sessão foi encerrada. Faça login novamente.', 401, 'SESSION_REVOKED'));
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
