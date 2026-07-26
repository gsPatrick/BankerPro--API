import * as analyticsService from './analytics.service.js';
import catchAsync from '../../utils/catch-async.js';
import { sendSuccess } from '../../utils/api-response.js';
import { getClientIp } from '../../utils/user-agent.js';

// O corpo pode chegar como objeto (fetch application/json) ou como string
// (navigator.sendBeacon manda text/plain para não disparar preflight de CORS).
const normalizarCorpo = (body) => {
  if (!body) return {};
  if (typeof body === 'string') {
    try { return JSON.parse(body); } catch { return {}; }
  }
  return body;
};

/**
 * Endpoint público de coleta. Recebe lotes de eventos da landing. Responde
 * rápido e nunca com erro que atrapalhe o navegador — telemetria é best-effort.
 */
export const collect = catchAsync(async (req, res) => {
  const payload = normalizarCorpo(req.body);
  const { visitorId, sessionId, context, events } = payload;

  const result = await analyticsService.ingest({
    visitorId,
    sessionId,
    context,
    events,
    ip: getClientIp(req),
    userAgent: req.headers['user-agent'] || ''
  });

  // 204 mantém o beacon leve; mesmo em erro de validação respondemos ok para
  // não gerar ruído no console do visitante.
  return res.status(204).end(result?.ok ? undefined : undefined);
});

// ── Admin ────────────────────────────────────────────────────
export const overview = catchAsync(async (req, res) => {
  const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
  const data = await analyticsService.getOverview({ days });
  return sendSuccess(res, data, 'Visão geral de analytics.');
});

export const visitors = catchAsync(async (req, res) => {
  const data = await analyticsService.listVisitors({
    page: Number(req.query.page) || 1,
    limit: Math.min(100, Number(req.query.limit) || 20),
    filter: req.query.filter || 'all',
    q: req.query.q || ''
  });
  return sendSuccess(res, data, 'Lista de visitantes.');
});

export const visitorDetail = catchAsync(async (req, res) => {
  const data = await analyticsService.getVisitorDetail(req.params.visitorId);
  if (!data) return res.status(404).json({ success: false, message: 'Visitante não encontrado.' });
  return sendSuccess(res, data, 'Detalhe do visitante.');
});

export const abandoned = catchAsync(async (req, res) => {
  const data = await analyticsService.listAbandoned({
    page: Number(req.query.page) || 1,
    limit: Math.min(100, Number(req.query.limit) || 20)
  });
  return sendSuccess(res, data, 'Compras abandonadas.');
});
