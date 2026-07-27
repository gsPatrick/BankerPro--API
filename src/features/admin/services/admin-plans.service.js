import { Plan, Subscription } from '../../../models/index.js';
import { PlanFeatureKeys } from '../../../config/constants.js';
import { invalidatePlanCache } from '../../../utils/plan-cache.js';
import { invalidateCache } from '../../../utils/redis-cache.js';
import { PLANS_PUBLIC_CACHE_KEY } from '../../subscription/subscription.service.js';
import AppError from '../../../utils/app-error.js';

// Uma mudança em plano invalida os dois caches: o de plano-por-key (permissões,
// em memória) e o da lista pública de planos (cards, no Redis).
const invalidarPlano = (key) => {
  invalidatePlanCache(key);
  invalidateCache(PLANS_PUBLIC_CACHE_KEY);
};

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

// limits é { featureKey: number }. Chaves precisam existir no catálogo e os
// valores serem inteiros (-1 ilimitado, 0 bloqueado, N teto). Uma key errada
// aqui viraria um limite que nunca é aplicado.
const assertValidLimits = (limits) => {
  if (limits === undefined || limits === null) return;
  if (typeof limits !== 'object' || Array.isArray(limits)) {
    throw new AppError('limits deve ser um objeto { funcionalidade: número }.', 400, 'BAD_REQUEST');
  }
  for (const [key, value] of Object.entries(limits)) {
    if (!PlanFeatureKeys.includes(key)) {
      throw new AppError(`Funcionalidade inexistente em limits: ${key}.`, 400, 'INVALID_PLAN_LIMIT');
    }
    if (!Number.isInteger(Number(value))) {
      throw new AppError(`Limite de "${key}" deve ser um número inteiro.`, 400, 'INVALID_PLAN_LIMIT');
    }
  }
};

// Período é só a periodicidade da cobrança. "Gratuito" NÃO é período: é a flag
// isFree, que qualquer período pode ter (ex.: personalizado de 7 dias grátis =
// trial que expira e obriga a assinar depois).
const VALID_BILLING = ['monthly', 'yearly', 'custom'];
const assertValidBilling = (billingPeriod) => {
  if (billingPeriod === undefined) return;
  if (!VALID_BILLING.includes(billingPeriod)) {
    throw new AppError(`Período inválido. Use: ${VALID_BILLING.join(', ')}.`, 400, 'INVALID_BILLING_PERIOD');
  }
};

// Normaliza a cobrança: isFree zera o preço; a duração padrão segue o período
// (mensal 30, anual 365) quando não informada.
const normalizeBilling = (data) => {
  const out = { ...data };
  if (out.isFree === true) {
    out.price = 0;
  }
  if (out.durationDays === undefined || out.durationDays === null || Number(out.durationDays) <= 0) {
    if (out.billingPeriod === 'yearly') out.durationDays = 365;
    else if (out.billingPeriod === 'monthly') out.durationDays = 30;
    // custom sem duração fica a cargo da validação da rota
  }
  if (out.durationDays !== undefined) out.durationDays = Math.max(1, Number(out.durationDays) || 30);
  return out;
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
  assertValidLimits(data.limits);
  assertValidBilling(data.billingPeriod);

  const clean = normalizeBilling(data);
  if (clean.trialDays !== undefined) clean.trialDays = Math.max(0, Number(clean.trialDays) || 0);
  const plan = await Plan.create(clean);
  invalidarPlano(plan.key);
  return plan;
};

export const updatePlan = async (id, data) => {
  const plan = await Plan.findByPk(id);
  if (!plan) {
    throw new AppError('Plano não encontrado.', 404, 'PLAN_NOT_FOUND');
  }

  assertValidPermissions(data.permissions);
  assertValidLimits(data.limits);
  assertValidBilling(data.billingPeriod);

  // Campos simples: aplica só os enviados.
  ['name', 'price', 'limitSimulations', 'features', 'permissions', 'limits', 'trialDays'].forEach((field) => {
    if (data[field] !== undefined) plan[field] = field === 'trialDays' ? Math.max(0, Number(data[field]) || 0) : data[field];
  });

  // Cobrança: se o admin mexeu em qualquer campo do ciclo, recalcula o conjunto
  // (free zera preço, duração segue o período quando não informada).
  const mexeuCobranca = ['billingPeriod', 'durationDays', 'isFree'].some((f) => data[f] !== undefined);
  if (mexeuCobranca) {
    const merged = normalizeBilling({
      billingPeriod: data.billingPeriod ?? plan.billingPeriod,
      durationDays: data.durationDays ?? plan.durationDays,
      isFree: data.isFree ?? plan.isFree,
      price: data.price ?? plan.price
    });
    plan.billingPeriod = merged.billingPeriod;
    plan.durationDays = merged.durationDays;
    plan.isFree = merged.isFree;
    plan.price = merged.price;
  }

  await plan.save();
  invalidarPlano(plan.key);
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
  invalidarPlano(plan.key);
  return { success: true };
};
