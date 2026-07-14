import { Op } from 'sequelize';
import { Subscription, Simulation, Plan } from '../models/index.js';
import AppError from '../utils/app-error.js';
import catchAsync from '../utils/catch-async.js';

export const checkSimulationLimit = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  // 1) Obter assinatura ativa do usuário
  const sub = await Subscription.findOne({
    where: { userId, status: 'active' }
  });

  const planKey = sub ? sub.plan : 'free';
  const plan = await Plan.findOne({ where: { key: planKey } });

  // Se o plano tiver limite de -1, significa simulações ilimitadas
  if (plan && plan.limitSimulations === -1) {
    return next();
  }

  const limit = plan ? plan.limitSimulations : 10;

  // 2) Validar limite de simulações nos últimos 30 dias
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - 30);

  const count = await Simulation.count({
    where: {
      createdByUserId: userId,
      created_at: {
        [Op.gte]: dateLimit
      }
    }
  });

  if (count >= limit) {
    return next(new AppError(
      `Você atingiu o limite de ${limit} simulações do plano '${plan ? plan.name : 'Gratuito'}' nos últimos 30 dias. Faça um upgrade para outro plano para continuar!`,
      403,
      'LIMIT_EXCEEDED'
    ));
  }

  next();
});
