import { getPlanFeatureLabel } from '../config/constants.js';
import { getPlanByKey } from '../utils/plan-cache.js';
import AppError from '../utils/app-error.js';
import catchAsync from '../utils/catch-async.js';

/**
 * Libera a rota apenas se o plano ativo do usuário incluir a funcionalidade.
 * Esconder o item no menu não basta: sem esta checagem a rota continua aberta
 * para quem chamar a API direto.
 *
 * Aceita mais de uma key quando o mesmo endpoint serve páginas diferentes —
 * basta uma delas estar no plano. É o caso de /clients, que alimenta tanto a
 * Carteira quanto a Agenda.
 */
export const requirePermission = (...featureKeys) =>
  catchAsync(async (req, res, next) => {
    // Admin usa o painel inteiro para dar suporte; não faz sentido barrá-lo.
    if (req.user?.role === 'admin') return next();

    const label = featureKeys.map(getPlanFeatureLabel).join(' ou ');

    // O requireAuth já carregou a assinatura ativa do usuário; reusá-la evita
    // repetir a mesma query em toda rota protegida por plano.
    const subscription = req.user.subscriptions?.[0];

    if (!subscription) {
      return next(new AppError(
        `A funcionalidade "${label}" exige um plano ativo.`,
        403,
        'PLAN_FEATURE_DENIED'
      ));
    }

    const plan = await getPlanByKey(subscription.plan);
    const permissions = Array.isArray(plan?.permissions) ? plan.permissions : [];

    if (!featureKeys.some((key) => permissions.includes(key))) {
      return next(new AppError(
        `A funcionalidade "${label}" não está incluída no seu plano.`,
        403,
        'PLAN_FEATURE_DENIED'
      ));
    }

    next();
  });
