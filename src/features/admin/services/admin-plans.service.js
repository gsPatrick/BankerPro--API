import { Plan } from '../../../models/index.js';
import { PlanFeatureKeys } from '../../../config/constants.js';
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
  return plan;
};

export const deletePlan = async (id) => {
  const plan = await Plan.findByPk(id);
  if (!plan) {
    throw new AppError('Plano não encontrado.', 404, 'PLAN_NOT_FOUND');
  }

  if (plan.key === 'free') {
    throw new AppError('O plano padrão gratuito (free) não pode ser excluído.', 400, 'BAD_REQUEST');
  }

  await plan.destroy();
  return { success: true };
};
