import * as subscriptionService from './subscription.service.js';
import catchAsync from '../../utils/catch-async.js';
import { sendSuccess, sendCreated } from '../../utils/api-response.js';
import AppError from '../../utils/app-error.js';

export const getPlans = catchAsync(async (req, res, next) => {
  const plans = await subscriptionService.listPlans();
  return sendSuccess(res, plans, 'Lista de planos disponíveis.');
});

export const getCurrentSubscription = catchAsync(async (req, res, next) => {
  const subscription = await subscriptionService.getSubscriptionByUserId(req.user.id);
  return sendSuccess(res, subscription, 'Assinatura atual do usuário.');
});

export const checkout = catchAsync(async (req, res, next) => {
  const { planType } = req.body;

  if (!planType) {
    return next(new AppError('Tipo do plano (planType) é obrigatório.', 400, 'BAD_REQUEST'));
  }

  const preference = await subscriptionService.checkoutSubscription(req.user.id, planType);
  return sendSuccess(res, preference, 'Checkout criado com sucesso.');
});

export const webhook = catchAsync(async (req, res, next) => {
  const payload = { ...req.body, ...req.query };
  const result = await subscriptionService.handlePaymentWebhook(payload);
  return sendSuccess(res, result, 'Webhook recebido.');
});

// --- ADMIN PLAN CRUD ---
export const createPlan = catchAsync(async (req, res, next) => {
  const { key, name, price, limitSimulations } = req.body;

  if (!key || !name || price === undefined || limitSimulations === undefined) {
    return next(new AppError('Campos obrigatórios de plano ausentes.', 400, 'BAD_REQUEST'));
  }

  const plan = await subscriptionService.createPlan(req.body);
  return sendSuccess(res, plan, 'Plano de assinatura criado com sucesso.', 201);
});

export const updatePlan = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const plan = await subscriptionService.updatePlan(id, req.body);
  return sendSuccess(res, plan, 'Plano de assinatura atualizado.');
});

export const deletePlan = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  await subscriptionService.deletePlan(id);
  return sendSuccess(res, { success: true }, 'Plano de assinatura removido.');
});
