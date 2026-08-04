import { Op } from 'sequelize';
import { Simulation, Client, Goal, Note, AudioAnalysis, FeatureUsage } from '../models/index.js';
import { getPlanByKey } from '../utils/plan-cache.js';
import { getPlanFeatureLabel } from '../config/constants.js';
import AppError from '../utils/app-error.js';
import catchAsync from '../utils/catch-async.js';
import { adquirirTrava } from '../utils/request-lock.js';

/**
 * Funcionalidades cujo uso já vira um registro próprio: contamos a tabela real
 * (mais preciso, sem precisar de log paralelo). As demais funcionalidades
 * limitáveis (Copiloto, Gerador, WhatsApp) não têm tabela e caem no FeatureUsage.
 */
const REAL_TABLE_COUNTERS = {
  cenarios: { model: Simulation, field: 'createdByUserId' },
  carteira: { model: Client, field: 'createdByUserId' },
  metas: { model: Goal, field: 'createdByUserId' },
  anotacoes: { model: Note, field: 'createdByUserId' },
  analise_audio: { model: AudioAnalysis, field: 'createdByUserId' }
};

// Lê o limite da funcionalidade no plano. Mantém compatibilidade: se limits não
// trouxer 'cenarios', cai no antigo limitSimulations.
const resolveLimit = (plan, featureKey) => {
  const fromLimits = plan?.limits?.[featureKey];
  if (fromLimits !== undefined && fromLimits !== null && fromLimits !== '') {
    return Number(fromLimits);
  }
  if (featureKey === 'cenarios' && plan?.limitSimulations !== undefined && plan?.limitSimulations !== null) {
    return Number(plan.limitSimulations);
  }
  return null; // não configurado = ilimitado
};

/**
 * Barra a ação quando o uso da funcionalidade atinge o teto do plano no ciclo.
 *
 * - Admin nunca é barrado.
 * - Limite ausente ou negativo (-1) = ilimitado.
 * - Limite 0 = bloqueado.
 * - A janela de contagem é o durationDays do plano (mensal ≈ 30).
 *
 * Para as funcionalidades sem tabela própria, registra o uso no FeatureUsage
 * quando a ação termina com sucesso (status < 400), via res 'finish'.
 */
export const enforceLimit = (featureKey) =>
  catchAsync(async (req, res, next) => {
    if (req.user?.role === 'admin') return next();

    const subscription = req.user.subscriptions?.[0];
    const plan = subscription ? await getPlanByKey(subscription.plan) : null;

    const limit = resolveLimit(plan, featureKey);
    if (limit === null || Number.isNaN(limit) || limit < 0) return next(); // ilimitado

    const label = getPlanFeatureLabel(featureKey);
    if (limit === 0) {
      return next(new AppError(
        `A funcionalidade "${label}" não está incluída no seu plano.`,
        403,
        'LIMIT_EXCEEDED'
      ));
    }

    // Serializa as chamadas do mesmo usuário nesta funcionalidade. Sem isto, dez
    // requisições simultâneas leem o mesmo contador antigo e passam todas — o
    // limite do plano vira sugestão. A trava cai sozinha por TTL, e é liberada
    // ao fim da resposta.
    const liberarTrava = await adquirirTrava(`limite:${req.user.id}:${featureKey}`);
    if (!liberarTrava) {
      return next(new AppError(
        'Uma ação sua ainda está sendo processada. Aguarde um instante e tente novamente.',
        429,
        'ACTION_IN_PROGRESS'
      ));
    }
    res.on('finish', () => { liberarTrava(); });
    res.on('close', () => { liberarTrava(); });

    const windowDays = Number(plan?.durationDays) > 0 ? Number(plan.durationDays) : 30;
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

    const counter = REAL_TABLE_COUNTERS[featureKey];
    let count;
    if (counter) {
      count = await counter.model.count({
        where: { [counter.field]: req.user.id, created_at: { [Op.gte]: since } }
      });
    } else {
      count = await FeatureUsage.count({
        where: { userId: req.user.id, featureKey, created_at: { [Op.gte]: since } }
      });
      // Sem tabela própria: registra o uso só se a ação der certo.
      res.on('finish', () => {
        if (res.statusCode < 400) {
          FeatureUsage.create({ userId: req.user.id, featureKey }).catch(() => {});
        }
      });
    }

    if (count >= limit) {
      return next(new AppError(
        `Você atingiu o limite de ${limit} de "${label}" no seu plano neste ciclo. Faça um upgrade para continuar.`,
        403,
        'LIMIT_EXCEEDED'
      ));
    }

    next();
  });

/**
 * Mantido por compatibilidade com quem importava checkSimulationLimit; hoje é o
 * enforceLimit da funcionalidade de cenários.
 */
export const checkSimulationLimit = enforceLimit('cenarios');
