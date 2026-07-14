import * as adminPlansService from '../services/admin-plans.service.js';
import catchAsync from '../../../utils/catch-async.js';
import { sendSuccess } from '../../../utils/api-response.js';
import AppError from '../../../utils/app-error.js';

export const getPlans = catchAsync(async (req, res, next) => {
  const plans = await adminPlansService.listPlans();
  return sendSuccess(res, plans, 'Todos os planos de assinatura.');
});

export const createPlan = catchAsync(async (req, res, next) => {
  const { key, name, price, limitSimulations } = req.body;

  if (!key || !name || price === undefined || limitSimulations === undefined) {
    return next(new AppError('Campos obrigatórios do plano ausentes.', 400, 'BAD_REQUEST'));
  }

  const plan = await adminPlansService.createPlan(req.body);
  return sendSuccess(res, plan, 'Plano de assinatura criado.', 201);
});

export const updatePlan = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const plan = await adminPlansService.updatePlan(id, req.body);
  return sendSuccess(res, plan, 'Plano de assinatura atualizado.');
});

export const deletePlan = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  await adminPlansService.deletePlan(id);
  return sendSuccess(res, { success: true }, 'Plano de assinatura removido.');
});
