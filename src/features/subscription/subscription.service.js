import { Subscription, User, Plan } from '../../models/index.js';
import * as mpProvider from '../../providers/mercadopago/mercadopago.provider.js';
import AppError from '../../utils/app-error.js';
import { getSettingValue } from '../../utils/settings-resolver.js';

export const listPlans = async () => {
  const plans = await Plan.findAll({
    order: [['price', 'ASC']]
  });
  return plans;
};

export const getSubscriptionByUserId = async (userId) => {
  const sub = await Subscription.findOne({
    where: { userId, status: 'active' },
    order: [['created_at', 'DESC']]
  });

  return sub || null;
};

export const activateFreePlan = async (userId, planType = 'free') => {
  const plan = await Plan.findOne({ where: { key: planType } });
  if (!plan) {
    throw new AppError('Plano inválido.', 404, 'PLAN_NOT_FOUND');
  }

  if (parseFloat(plan.price) > 0) {
    throw new AppError('Este endpoint é apenas para planos gratuitos.', 400, 'BAD_REQUEST');
  }

  await Subscription.update(
    { status: 'cancelled' },
    { where: { userId, status: 'active' } }
  );

  const subscription = await Subscription.create({
    userId,
    plan: planType,
    status: 'active',
    startsAt: new Date(),
    endsAt: null
  });

  return subscription;
};

export const checkoutSubscription = async (userId, planType, paymentMethod = null, cardToken = null, docNumber = null, docType = 'CPF') => {
  const plan = await Plan.findOne({ where: { key: planType } });
  if (!plan) {
    throw new AppError('Plano inválido para checkout.', 404, 'PLAN_NOT_FOUND');
  }

  if (parseFloat(plan.price) <= 0 || planType === 'free' || paymentMethod === 'free') {
    const subscription = await activateFreePlan(userId, plan.key || planType || 'free');
    return {
      free: true,
      planSelected: true,
      activated: true,
      subscription
    };
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw new AppError('Usuário não encontrado.', 404, 'USER_NOT_FOUND');
  }

  // Checkout transparente: exigir método de pagamento no site (cartão ou PIX)
  if (!paymentMethod) {
    throw new AppError(
      'Informe o método de pagamento: credit_card ou pix.',
      400,
      'PAYMENT_METHOD_REQUIRED'
    );
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

    return {
      ...preapproval,
      paymentMethod: 'credit_card',
      activated: preapproval.status === 'authorized' || preapproval.status === 'active'
    };
  }

  if (paymentMethod === 'pix') {
    if (!docNumber) {
      throw new AppError('CPF/CNPJ do pagador (docNumber) é obrigatório para pagamento via PIX.', 400, 'BAD_REQUEST');
    }
    const payment = await mpProvider.createPixPayment(userId, user.email, planType, parseFloat(plan.price), docNumber, docType);
    const transactionData = payment.point_of_interaction?.transaction_data || {};

    return {
      id: payment.id,
      status: payment.status,
      paymentMethod: 'pix',
      qrCodeBase64: transactionData.qr_code_base64 || null,
      qrCodeCopy: transactionData.qr_code || transactionData.qr_code_copy || null,
      pointOfInteraction: payment.point_of_interaction
    };
  }

  throw new AppError('Método de pagamento não suportado. Use credit_card ou pix.', 400, 'BAD_REQUEST');
};

export const activateSubscriptionFromApprovedPayment = async (payment) => {
  if (payment.status !== 'approved') {
    return {
      status: payment.status,
      activated: false
    };
  }

  let externalData;
  try {
    externalData = typeof payment.external_reference === 'string'
      ? JSON.parse(payment.external_reference)
      : payment.external_reference;
  } catch (e) {
    throw new AppError('Referência externa do pagamento inválida.', 400, 'INVALID_EXTERNAL_REFERENCE');
  }

  const { userId, planType } = externalData || {};
  if (!userId || !planType) {
    throw new AppError('Pagamento sem dados de usuário/plano.', 400, 'MISSING_PAYMENT_DATA');
  }

  const plan = await Plan.findOne({ where: { key: planType } });
  if (!plan) {
    throw new AppError('Plano do pagamento não encontrado.', 404, 'PLAN_NOT_FOUND');
  }

  const existing = await Subscription.findOne({
    where: {
      userId,
      status: 'active',
      mpSubscriptionId: payment.id?.toString()
    }
  });

  if (existing) {
    return {
      status: 'approved',
      activated: true,
      subscription: existing
    };
  }

  const startsAt = new Date();
  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + 30);

  await Subscription.update(
    { status: 'cancelled' },
    { where: { userId, status: 'active' } }
  );

  const subscription = await Subscription.create({
    userId,
    plan: planType,
    status: 'active',
    mpSubscriptionId: payment.id.toString(),
    startsAt,
    endsAt
  });

  return {
    status: 'approved',
    activated: true,
    subscription
  };
};

export const checkPaymentStatus = async (paymentId, requestingUserId) => {
  const payment = await mpProvider.getPaymentDetails(paymentId);

  let externalData = null;
  try {
    externalData = typeof payment.external_reference === 'string'
      ? JSON.parse(payment.external_reference)
      : payment.external_reference;
  } catch {
    externalData = null;
  }

  if (externalData?.userId && externalData.userId !== requestingUserId) {
    throw new AppError('Pagamento não pertence a este usuário.', 403, 'PERMISSION_DENIED');
  }

  if (payment.status === 'approved') {
    return activateSubscriptionFromApprovedPayment(payment);
  }

  return {
    status: payment.status,
    activated: false
  };
};

export const getCheckoutPublicConfig = async () => {
  const publicKey = await getSettingValue('MP_PUBLIC_KEY');
  return {
    publicKey: publicKey && publicKey !== 'your_mercado_pago_public_key_here' ? publicKey : null
  };
};

export const handlePaymentWebhook = async (payload) => {
  const paymentId = payload.data?.id || payload.id;
  if (!paymentId) {
    return { received: true };
  }

  try {
    const payment = await mpProvider.getPaymentDetails(paymentId);

    if (payment.status === 'approved') {
      const result = await activateSubscriptionFromApprovedPayment(payment);
      console.log(`✅ Assinatura ativada via webhook. Pagamento: ${paymentId}.`);
      return result;
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
