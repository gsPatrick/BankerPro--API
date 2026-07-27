import { Op, fn, col, literal } from 'sequelize';
import { AnalyticsVisitor, AnalyticsSession, AnalyticsEvent } from '../../models/index.js';
import { parseUserAgent } from '../../utils/user-agent.js';
import { lookupGeo } from '../../utils/geo-ip.js';

/**
 * Enriquece visitante e sessão com a localização do IP, em segundo plano (não
 * bloqueia a resposta do beacon). Só roda quando ainda não temos geo.
 */
const enrichGeo = (visitorId, sessionId, ip) => {
  lookupGeo(ip)
    .then(async (geo) => {
      if (!geo) return;
      await AnalyticsVisitor.update(
        { country: geo.country, countryCode: geo.countryCode, region: geo.region, city: geo.city },
        { where: { visitorId, country: null } }
      );
      await AnalyticsSession.update(
        { country: geo.country, countryCode: geo.countryCode, region: geo.region, city: geo.city },
        { where: { sessionId } }
      );
    })
    .catch(() => { /* melhor esforço */ });
};

const str = (v, max = 255) => (v === null || v === undefined ? null : String(v).slice(0, max));
const asDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * Ingestão de um lote de eventos vindo do navegador. Nunca lança para o cliente:
 * telemetria não pode derrubar a landing. Enriquece com IP e device (do servidor),
 * faz upsert do visitante e da sessão, grava os eventos e atualiza o estágio do
 * funil.
 */
export const ingest = async ({ visitorId, sessionId, context = {}, events = [], ip, userAgent }) => {
  if (!visitorId || !sessionId) {
    return { ok: false, reason: 'missing_ids' };
  }

  const now = new Date();
  const ua = parseUserAgent(userAgent);
  const lista = Array.isArray(events) ? events.slice(0, 100) : [];

  // Momento do último evento do lote (para medir duração). Cai no relógio do
  // servidor se o cliente não mandar occurredAt.
  let lastEventAt = now;
  for (const ev of lista) {
    const oc = asDate(ev?.occurredAt);
    if (oc && oc > lastEventAt) lastEventAt = oc;
  }

  const has = (type) => lista.some((e) => e?.type === type);
  const identifyEv = [...lista].reverse().find((e) => e?.type === 'identify');

  // ── Visitante ─────────────────────────────────────────────
  let visitor = await AnalyticsVisitor.findOne({ where: { visitorId } });
  if (!visitor) {
    visitor = await AnalyticsVisitor.create({
      visitorId: str(visitorId, 64),
      firstSeenAt: now,
      lastSeenAt: now,
      ipAddress: str(ip, 64),
      userAgent: str(userAgent, 1000),
      deviceType: ua.deviceType,
      os: ua.os,
      browser: ua.browser,
      firstUtmSource: str(context.utmSource, 120),
      firstUtmMedium: str(context.utmMedium, 120),
      firstUtmCampaign: str(context.utmCampaign, 160),
      firstReferrer: str(context.referrer, 255)
    });
  } else {
    visitor.lastSeenAt = now;
    if (ip) visitor.ipAddress = str(ip, 64);
    if (userAgent) {
      visitor.userAgent = str(userAgent, 1000);
      visitor.deviceType = ua.deviceType;
      visitor.os = ua.os;
      visitor.browser = ua.browser;
    }
  }

  // Identificação: liga o IP a uma pessoa quando ela digita nome/e-mail.
  if (identifyEv) {
    const m = identifyEv.metadata || {};
    const email = str(m.email, 160);
    const name = str(m.name, 160);
    const phone = str(m.phone, 40);
    if (email && !visitor.email) visitor.email = email.toLowerCase();
    else if (email) visitor.email = email.toLowerCase();
    if (name) visitor.name = name;
    if (phone) visitor.phone = phone;
    if ((email || name || phone) && !visitor.identifiedAt) visitor.identifiedAt = now;
  }
  if (has('checkout_start')) visitor.checkoutStarted = true;
  if (has('purchase')) visitor.purchased = true;

  // ── Sessão ────────────────────────────────────────────────
  let session = await AnalyticsSession.findOne({ where: { sessionId } });
  const isNewSession = !session;
  if (!session) {
    const startedAt = asDate(context.startedAt) || now;
    session = await AnalyticsSession.create({
      sessionId: str(sessionId, 64),
      visitorId: str(visitorId, 64),
      startedAt,
      lastEventAt,
      durationSeconds: Math.max(0, Math.round((lastEventAt - startedAt) / 1000)),
      ipAddress: str(ip, 64),
      userAgent: str(userAgent, 1000),
      deviceType: ua.deviceType,
      os: ua.os,
      browser: ua.browser,
      screenSize: str(context.screenSize, 20),
      language: str(context.language, 20),
      referrer: str(context.referrer, 255),
      landingPath: str(context.landingPath, 255),
      utmSource: str(context.utmSource, 120),
      utmMedium: str(context.utmMedium, 120),
      utmCampaign: str(context.utmCampaign, 160),
      utmTerm: str(context.utmTerm, 160),
      utmContent: str(context.utmContent, 160),
      fbclid: str(context.fbclid, 300),
      gclid: str(context.gclid, 300)
    });
    visitor.sessionsCount = (visitor.sessionsCount || 0) + 1;
  } else {
    if (lastEventAt > session.lastEventAt) session.lastEventAt = lastEventAt;
    session.durationSeconds = Math.max(
      session.durationSeconds || 0,
      Math.round((session.lastEventAt - session.startedAt) / 1000)
    );
  }

  session.eventsCount = (session.eventsCount || 0) + lista.length;
  session.pageviewsCount = (session.pageviewsCount || 0) + lista.filter((e) => e?.type === 'pageview').length;
  session.clicksCount = (session.clicksCount || 0) + lista.filter((e) => e?.type === 'click').length;
  if (has('checkout_start')) session.checkoutStarted = true;
  if (has('purchase')) session.purchased = true;

  await visitor.save();
  await session.save();

  // Geo por IP em segundo plano: numa sessão nova ou quando ainda não temos a
  // localização do visitante. Não await — o beacon fecha na hora.
  if (ip && (isNewSession || !visitor.country)) {
    enrichGeo(visitorId, sessionId, ip);
  }

  // ── Eventos ───────────────────────────────────────────────
  // Heartbeats não viram linha: eles só servem para medir duração (já aplicada
  // acima). Guardar todos incharia a tabela sem informação nova.
  const paraGravar = lista
    .filter((e) => e && e.type && e.type !== 'heartbeat')
    .map((e) => ({
      sessionId: str(sessionId, 64),
      visitorId: str(visitorId, 64),
      type: str(e.type, 40),
      name: str(e.name, 200),
      path: str(e.path, 255),
      metadata: e.metadata && typeof e.metadata === 'object' ? e.metadata : null,
      occurredAt: asDate(e.occurredAt) || now
    }));

  if (paraGravar.length) {
    await AnalyticsEvent.bulkCreate(paraGravar);
  }

  return { ok: true, newSession: isNewSession, stored: paraGravar.length };
};

// ─────────────────────────────────────────────────────────────
// Leituras do painel administrativo
// ─────────────────────────────────────────────────────────────

const rangeStart = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

/**
 * Normaliza a origem para exibição: junta apelidos da mesma fonte (ig/instagram,
 * fb/facebook) e descarta o que não é origem de verdade — IP de referrer e o
 * próprio domínio (navegação interna) viram "direto".
 */
const canonicalSource = (raw) => {
  const s = String(raw || '').trim().toLowerCase();
  if (!s) return 'direto';
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(s)) return 'direto';       // IP não é origem
  if (s.includes('closeria')) return 'direto';                  // self-referral
  if (['ig', 'insta', 'instagram', 'instagram.com', 'l.instagram.com'].includes(s)) return 'instagram';
  if (['fb', 'face', 'facebook', 'facebook.com', 'l.facebook.com', 'lm.facebook.com', 'm.facebook.com'].includes(s)) return 'facebook';
  if (['meta'].includes(s)) return 'meta';
  if (['wa', 'whatsapp', 'whatsapp.com', 'wa.me'].includes(s)) return 'whatsapp';
  if (['google', 'adwords', 'google-ads', 'googleads', 'gads', 'google.com'].includes(s)) return 'google';
  if (['tiktok', 'tt', 'tiktok.com'].includes(s)) return 'tiktok';
  if (['yt', 'youtube', 'youtube.com', 'youtu.be'].includes(s)) return 'youtube';
  return s;
};

// Junta as contagens por origem canônica e devolve as maiores.
const mergeSources = (rows) => {
  const map = {};
  for (const r of rows) {
    const key = canonicalSource(r.utm_source);
    map[key] = (map[key] || 0) + Number(r.count);
  }
  return Object.entries(map)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
};

export const getOverview = async ({ days = 30 } = {}) => {
  const since = rangeStart(days);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    visitorsInRange,
    visitorsToday,
    identifiedInRange,
    sessionsInRange,
    sessionsToday,
    checkoutStartsInRange,
    purchasesInRange,
    abandonedInRange,
    avgRow,
    deviceRows,
    sourceRows,
    regionRows
  ] = await Promise.all([
    AnalyticsVisitor.count({ where: { lastSeenAt: { [Op.gte]: since } } }),
    AnalyticsVisitor.count({ where: { firstSeenAt: { [Op.gte]: startOfToday } } }),
    AnalyticsVisitor.count({ where: { lastSeenAt: { [Op.gte]: since }, email: { [Op.ne]: null } } }),
    AnalyticsSession.count({ where: { startedAt: { [Op.gte]: since } } }),
    AnalyticsSession.count({ where: { startedAt: { [Op.gte]: startOfToday } } }),
    AnalyticsSession.count({ where: { startedAt: { [Op.gte]: since }, checkoutStarted: true } }),
    AnalyticsSession.count({ where: { startedAt: { [Op.gte]: since }, purchased: true } }),
    AnalyticsSession.count({ where: { startedAt: { [Op.gte]: since }, checkoutStarted: true, purchased: false } }),
    AnalyticsSession.findOne({
      where: { startedAt: { [Op.gte]: since } },
      attributes: [[fn('AVG', col('duration_seconds')), 'avg']],
      raw: true
    }),
    AnalyticsSession.findAll({
      where: { startedAt: { [Op.gte]: since } },
      attributes: ['device_type', [fn('COUNT', col('id')), 'count']],
      group: ['device_type'],
      raw: true
    }),
    AnalyticsSession.findAll({
      where: { startedAt: { [Op.gte]: since } },
      attributes: ['utm_source', [fn('COUNT', col('id')), 'count']],
      group: ['utm_source'],
      raw: true
    }),
    AnalyticsSession.findAll({
      where: { startedAt: { [Op.gte]: since }, region: { [Op.ne]: null } },
      attributes: ['region', 'country', [fn('COUNT', col('id')), 'count']],
      group: ['region', 'country'],
      order: [[literal('count'), 'DESC']],
      limit: 8,
      raw: true
    })
  ]);

  const avgDuration = Math.round(Number(avgRow?.avg || 0));
  const conversionRate = sessionsInRange > 0 ? purchasesInRange / sessionsInRange : 0;

  return {
    days,
    visitors: { range: visitorsInRange, today: visitorsToday, identified: identifiedInRange },
    sessions: { range: sessionsInRange, today: sessionsToday, avgDurationSeconds: avgDuration },
    funnel: {
      checkoutStarts: checkoutStartsInRange,
      purchases: purchasesInRange,
      abandoned: abandonedInRange,
      conversionRate
    },
    byDevice: deviceRows.map((r) => ({ device: r.device_type || 'desconhecido', count: Number(r.count) })),
    bySource: mergeSources(sourceRows),
    byRegion: regionRows.map((r) => ({
      region: [r.region, r.country].filter(Boolean).join(' · ') || 'desconhecido',
      count: Number(r.count)
    }))
  };
};

export const listVisitors = async ({ page = 1, limit = 20, filter = 'all', q = '' } = {}) => {
  const where = {};
  if (filter === 'identified') where.email = { [Op.ne]: null };
  else if (filter === 'abandoned') { where.checkoutStarted = true; where.purchased = false; }
  else if (filter === 'purchased') where.purchased = true;

  if (q && q.trim()) {
    const like = { [Op.iLike]: `%${q.trim()}%` };
    where[Op.or] = [{ name: like }, { email: like }, { ipAddress: like }];
  }

  const offset = (Math.max(1, page) - 1) * limit;
  const { rows, count } = await AnalyticsVisitor.findAndCountAll({
    where,
    order: [['lastSeenAt', 'DESC']],
    limit,
    offset
  });

  return {
    items: rows.map((v) => v.toJSON()),
    total: count,
    page: Number(page),
    limit: Number(limit),
    pages: Math.ceil(count / limit)
  };
};

export const getVisitorDetail = async (visitorId) => {
  const visitor = await AnalyticsVisitor.findOne({ where: { visitorId } });
  if (!visitor) return null;

  const [sessions, events] = await Promise.all([
    AnalyticsSession.findAll({ where: { visitorId }, order: [['startedAt', 'DESC']] }),
    AnalyticsEvent.findAll({
      where: { visitorId },
      order: [['occurredAt', 'DESC']],
      limit: 300
    })
  ]);

  return {
    visitor: visitor.toJSON(),
    sessions: sessions.map((s) => s.toJSON()),
    events: events.map((e) => e.toJSON())
  };
};

/**
 * Compras abandonadas: quem começou o checkout e não comprou. Prioriza os
 * identificados (têm e-mail), que é a lista de disparo de recuperação.
 */
export const listAbandoned = async ({ page = 1, limit = 20 } = {}) => {
  const where = { checkoutStarted: true, purchased: false };
  const offset = (Math.max(1, page) - 1) * limit;
  const { rows, count } = await AnalyticsVisitor.findAndCountAll({
    where,
    order: [
      [literal('CASE WHEN email IS NOT NULL THEN 0 ELSE 1 END'), 'ASC'],
      ['lastSeenAt', 'DESC']
    ],
    limit,
    offset
  });

  return {
    items: rows.map((v) => v.toJSON()),
    total: count,
    identifiedTotal: await AnalyticsVisitor.count({ where: { ...where, email: { [Op.ne]: null } } }),
    page: Number(page),
    limit: Number(limit),
    pages: Math.ceil(count / limit)
  };
};
