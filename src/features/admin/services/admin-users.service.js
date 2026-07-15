import { User, UserProfile, Subscription, Plan } from '../../../models/index.js';
import AppError from '../../../utils/app-error.js';

export const listUsers = async () => {
  return await User.findAll({
    attributes: { exclude: ['password', 'passwordHash'] },
    include: [
      { model: UserProfile, as: 'profile' },
      {
        model: Subscription,
        as: 'subscriptions',
        required: false,
        separate: true,
        order: [
          ['created_at', 'DESC'],
          ['starts_at', 'DESC'],
        ],
        include: [
          {
            model: Plan,
            as: 'planDetails',
            required: false,
            attributes: ['key', 'name', 'price', 'limitSimulations'],
          },
        ],
      },
    ],
    order: [['created_at', 'DESC']],
  });
};

export const updateUserRole = async (id, role) => {
  const user = await User.findByPk(id);
  if (!user) {
    throw new AppError('Usuário não encontrado.', 404, 'USER_NOT_FOUND');
  }

  if (!['admin', 'user'].includes(role)) {
    throw new AppError('Role inválida.', 400, 'BAD_REQUEST');
  }

  user.role = role;
  await user.save();
  
  user.password = undefined; // ocultar senha
  return user;
};

export const updateUserStatus = async (id, isActive) => {
  const user = await User.findByPk(id);
  if (!user) {
    throw new AppError('Usuário não encontrado.', 404, 'USER_NOT_FOUND');
  }

  user.isActive = isActive;
  await user.save();

  user.password = undefined; // ocultar senha
  return user;
};

export const manualSubscription = async (userId, { planKey, durationDays }) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('Usuário não encontrado.', 404, 'USER_NOT_FOUND');
  }

  const planExists = await Plan.findOne({ where: { key: planKey } });
  if (!planExists) {
    throw new AppError(`Plano '${planKey}' não cadastrado no sistema.`, 404, 'PLAN_NOT_FOUND');
  }

  const startsAt = new Date();
  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + (durationDays ? parseInt(durationDays, 10) : 30));

  // Cancelar assinaturas ativas anteriores
  await Subscription.update(
    { status: 'cancelled' },
    { where: { userId, status: 'active' } }
  );

  const subscription = await Subscription.create({
    userId,
    plan: planKey,
    status: 'active',
    mpSubscriptionId: 'MANUAL_BY_ADMIN',
    startsAt,
    endsAt
  });

  return subscription;
};

export const deleteUser = async (id) => {
  const user = await User.findByPk(id);
  if (!user) {
    throw new AppError('Usuário não encontrado.', 404, 'USER_NOT_FOUND');
  }

  await user.destroy();
  return { success: true };
};
