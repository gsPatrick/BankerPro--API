import { Plan, Subscription } from '../../../models/index.js';
import { PlanFeatureKeys } from '../../../config/constants.js';
import { invalidatePlanCache } from '../../../utils/plan-cache.js';
import AppError from '../../../utils/app-error.js';

// permissions é o que libera as telas de verdade: uma key inexistente aqui vira
// uma funcionalidade que nunca abre, sem erro nenhum aparecer.
const assertValidPermissions = (permissions) => {
  if (permissions === undefined) return;
  if (!Array.isArray(permissions)) {
    throw new AppError('permissions deve ser uma lista.', 400, 'BAD_REQUEST');
  }
  const invalid = permissions.filter((key) => !PlanFeatureKeys.includes(key));
  if (invalid.length > 0) {
    throw new AppError(
      `Funcionalidade inexistente: ${invalid.join(', ')}. Válidas: ${PlanFeatureKeys.join(', ')}.`,
      400,
      'INVALID_PLAN_PERMISSION'
    );
  }
};

export const listPlans = async () => {
  return await Plan.findAll({
    order: [['price', 'ASC']]
  });
};

export const createPlan = async (data) => {
  const planExists = await Plan.findOne({ where: { key: data.key } });
  if (planExists) {
    throw new AppError(`Plano com a chave '${data.key}' já existe.`, 400, 'PLAN_ALREADY_EXISTS');
  }

  assertValidPermissions(data.permissions);

  const plan = await Plan.create(data);
  invalidatePlanCache(plan.key);
  return plan;
};

export const updatePlan = async (id, data) => {
  const plan = await Plan.findByPk(id);
  if (!plan) {
    throw new AppError('Plano não encontrado.', 404, 'PLAN_NOT_FOUND');
  }

  assertValidPermissions(data.permissions);

  const allowedFields = ['name', 'price', 'limitSimulations', 'features', 'permissions'];
  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      plan[field] = data[field];
    }
  });

  await plan.save();
  invalidatePlanCache(plan.key);
  return plan;
};

export const deletePlan = async (id) => {
  const plan = await Plan.findByPk(id);
  if (!plan) {
    throw new AppError('Plano não encontrado.', 404, 'PLAN_NOT_FOUND');
  }

  // subscriptions.plan é chave estrangeira para plans.key: sem esta checagem o
  // banco derruba a exclusão com uma violação de FK crua, em vez de um erro que
  // explica o que fazer.
  const inUse = await Subscription.count({ where: { plan: plan.key } });
  if (inUse > 0) {
    throw new AppError(
      `O plano "${plan.name}" não pode ser excluído: ${inUse} assinatura(s) apontam para ele. Migre essas assinaturas para outro plano antes.`,
      400,
      'PLAN_IN_USE'
    );
  }

  await plan.destroy();
  invalidatePlanCache(plan.key);
  return { success: true };
};
