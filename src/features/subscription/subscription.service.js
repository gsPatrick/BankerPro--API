import { Subscription, User, Plan } from '../../models/index.js';
import * as mpProvider from '../../providers/mercadopago/mercadopago.provider.js';
import AppError from '../../utils/app-error.js';

export const listPlans = async () => {
  const plans = await Plan.findAll({
    order: [['price', 'ASC']]
  });
  return plans;
};

export const getSubscriptionByUserId = async (userId) => {
  let sub = await Subscription.findOne({
    where: { userId, status: 'active' },
    order: [['created_at', 'DESC']]
  });

  if (!sub) {
    sub = {
      plan: 'free',
      status: 'active',
      startsAt: null,
      endsAt: null
    };
  }

  return sub;
};

export const checkoutSubscription = async (userId, planType) => {
  const plan = await Plan.findOne({ where: { key: planType } });
  if (!plan) {
    throw new AppError('Plano inválido para checkout.', 404, 'PLAN_NOT_FOUND');
  }

  if (parseFloat(plan.price) <= 0) {
    throw new AppError('Planos gratuitos não exigem checkout financeiro.', 400, 'BAD_REQUEST');
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('Usuário não encontrado.', 404, 'USER_NOT_FOUND');
  }

  const preference = await mpProvider.createCheckoutPreference(userId, user.email, planType, parseFloat(plan.price));
  return preference;
};

export const handlePaymentWebhook = async (payload) => {
  const paymentId = payload.data?.id || payload.id;
  if (!paymentId) {
    return { received: true };
  }

  const payment = await mpProvider.getPaymentDetails(paymentId);

  if (payment.status === 'approved') {
    let externalData;
    try {
      externalData = typeof payment.external_reference === 'string' 
        ? JSON.parse(payment.external_reference) 
        : payment.external_reference;
    } catch (e) {
      console.error('Falha ao parsear external_reference do pagamento:', payment.external_reference);
      return { error: 'Invalid external reference' };
    }

    const { userId, planType } = externalData || {};
    if (!userId || !planType) {
      return { error: 'Missing user or plan data' };
    }

    // Verificar se o plano existe no banco de dados antes de assinar
    const plan = await Plan.findOne({ where: { key: planType } });
    if (!plan) {
      console.error(`Plano ${planType} não encontrado no banco de dados. Ignorando ativação.`);
      return { error: 'Plan not found in database' };
    }

    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + 30); // 30 dias de vigência

    await Subscription.update(
      { status: 'cancelled' },
      { where: { userId, status: 'active' } }
    );

    const subscription = await Subscription.create({
      userId,
      plan: planType,
      status: 'active',
      mpSubscriptionId: paymentId.toString(),
      startsAt,
      endsAt
    });

    console.log(`✅ Assinatura ativada para o usuário ${userId}. Plano: ${planType}.`);
    return subscription;
  }

  return { status: payment.status };
};

// --- ADMIN PLAN CRUD ---
export const createPlan = async (data) => {
  const planExists = await Plan.findOne({ where: { key: data.key } });
  if (planExists) {
    throw new AppError(`Plano com a chave '${data.key}' já existe.`, 400, 'PLAN_ALREADY_EXISTS');
  }

  const plan = await Plan.create(data);
  return plan;
};

export const updatePlan = async (id, data) => {
  const plan = await Plan.findByPk(id);
  if (!plan) {
    throw new AppError('Plano não encontrado.', 404, 'PLAN_NOT_FOUND');
  }

  const allowedFields = ['name', 'price', 'limitSimulations', 'features'];
  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      plan[field] = data[field];
    }
  });

  await plan.save();
  return plan;
};

export const deletePlan = async (id) => {
  const plan = await Plan.findByPk(id);
  if (!plan) {
    throw new AppError('Plano não encontrado.', 404, 'PLAN_NOT_FOUND');
  }

  // Não permitir excluir o plano free básico pois é o default do sistema
  if (plan.key === 'free') {
    throw new AppError('O plano padrão gratuito (free) não pode ser excluído.', 400, 'BAD_REQUEST');
  }

  await plan.destroy();
  return { success: true };
};
