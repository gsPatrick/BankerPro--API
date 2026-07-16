import * as adminPlansService from '../services/admin-plans.service.js';
import { PlanFeatures } from '../../../config/constants.js';
import catchAsync from '../../../utils/catch-async.js';
import { sendSuccess } from '../../../utils/api-response.js';
import AppError from '../../../utils/app-error.js';

// O catálogo vem da API para o painel não manter uma cópia manual das keys: uma
// lista espelhada esquece de crescer quando uma funcionalidade nova entra, e o
// admin fica sem conseguir liberá-la.
export const getPlanFeatures = catchAsync(async (req, res) => {
  return sendSuccess(res, PlanFeatures, 'Funcionalidades que um plano pode liberar.');
});

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
