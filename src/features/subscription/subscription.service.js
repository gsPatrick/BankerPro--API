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

export const checkoutSubscription = async (userId, planType, paymentMethod = null, cardToken = null, docNumber = null, docType = 'CPF') => {
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

  // Se o método de pagamento não foi informado, utiliza o Checkout Pro (Redirecionamento) como fallback
  if (!paymentMethod) {
    const preference = await mpProvider.createCheckoutPreference(userId, user.email, planType, parseFloat(plan.price));
    return preference;
  }

  if (paymentMethod === 'credit_card') {
    if (!cardToken) {
      throw new AppError('Token do cartão de crédito (cardToken) é obrigatório.', 400, 'BAD_REQUEST');
    }
    const preapproval = await mpProvider.createPreapproval(userId, user.email, planType, parseFloat(plan.price), cardToken);
    
    // Se a assinatura de recorrência foi autorizada imediatamente, ativa no banco
    if (preapproval.status === 'authorized' || preapproval.status === 'active') {
      const startsAt = new Date();
      const endsAt = new Date();
      endsAt.setDate(endsAt.getDate() + 30); // 30 dias de vigência

      await Subscription.update(
        { status: 'cancelled' },
        { where: { userId, status: 'active' } }
      );

      await Subscription.create({
        userId,
        plan: planType,
        status: 'active',
        mpSubscriptionId: preapproval.id.toString(),
        startsAt,
        endsAt
      });
    }

    return preapproval;
  }

  if (paymentMethod === 'pix') {
    if (!docNumber) {
      throw new AppError('CPF/CNPJ do pagador (docNumber) é obrigatório para pagamento via PIX.', 400, 'BAD_REQUEST');
    }
    const payment = await mpProvider.createPixPayment(userId, user.email, planType, parseFloat(plan.price), docNumber, docType);
    return payment;
  }

  throw new AppError('Método de pagamento não suportado.', 400, 'BAD_REQUEST');
};

export const handlePaymentWebhook = async (payload) => {
  const paymentId = payload.data?.id || payload.id;
  if (!paymentId) {
    return { received: true };
  }

  try {
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
  } catch (error) {
    console.warn(`⚠️ Notificação do Mercado Pago com ID de teste ou não encontrado (${paymentId}):`, error.message);
    return { received: true, info: 'Mock or test transaction ignored' };
  }
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
