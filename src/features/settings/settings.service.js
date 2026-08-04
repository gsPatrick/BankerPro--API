import { UserDeviceSession } from '../../models/index.js';
import AppError from '../../utils/app-error.js';
import { parseUserAgent } from '../../utils/user-agent.js';
import { rotateSessionsAndIssueToken } from '../auth/auth.service.js';

export const listSessions = async (userId) => {
  const rows = await UserDeviceSession.findAll({
    where: { userId },
    order: [['lastSeenAt', 'DESC'], ['created_at', 'DESC']]
  });
  return rows;
};

export const upsertSessionFromRequest = async (userId, { userAgent, ipAddress, markCurrent = true }) => {
  const parsed = parseUserAgent(userAgent);

  if (markCurrent) {
    await UserDeviceSession.update(
      { isCurrent: false },
      { where: { userId, isCurrent: true } }
    );
  }

  const existing = await UserDeviceSession.findOne({
    where: {
      userId,
      browser: parsed.browser,
      os: parsed.os,
      userAgent: parsed.userAgent || null
    },
    order: [['last_seen_at', 'DESC']]
  });

  if (existing) {
    existing.lastSeenAt = new Date();
    existing.ipAddress = ipAddress || existing.ipAddress;
    existing.isCurrent = markCurrent;
    existing.deviceLabel = parsed.deviceLabel;
    existing.deviceType = parsed.deviceType;
    await existing.save();
    return existing;
  }

  const criada = await UserDeviceSession.create({
    userId,
    deviceLabel: parsed.deviceLabel,
    browser: parsed.browser,
    os: parsed.os,
    deviceType: parsed.deviceType,
    userAgent: parsed.userAgent || null,
    ipAddress: ipAddress || null,
    lastSeenAt: new Date(),
    isCurrent: markCurrent
  });

  // A linha é criada por combinação de User-Agent, que quem chama a API escolhe:
  // variando o header a cada requisição, uma única conta gerava linhas sem fim
  // nesta tabela (e uma lista de dispositivos inútil na tela). Mantém as mais
  // recentes e descarta o excedente.
  await removerSessoesExcedentes(userId);

  return criada;
};

const MAXIMO_SESSOES = 20;

const removerSessoesExcedentes = async (userId) => {
  const antigas = await UserDeviceSession.findAll({
    where: { userId },
    order: [['last_seen_at', 'DESC']],
    offset: MAXIMO_SESSOES,
    limit: 100,
    attributes: ['id']
  });

  if (antigas.length === 0) return;
  await UserDeviceSession.destroy({ where: { id: antigas.map((s) => s.id) } });
};

export const revokeSession = async (userId, sessionId) => {
  const session = await UserDeviceSession.findOne({ where: { id: sessionId, userId } });
  if (!session) {
    throw new AppError('Sessão não encontrada.', 404, 'SESSION_NOT_FOUND');
  }
  if (session.isCurrent) {
    throw new AppError('Não é possível encerrar a sessão atual por aqui.', 400, 'CURRENT_SESSION');
  }
  await session.destroy();

  // Apagar a linha da lista não tirava ninguém do ar: o token do outro aparelho
  // continuava sendo aceito, então "encerrar sessão" era só visual. Invalidar as
  // sessões é o que realmente derruba o aparelho perdido/roubado; o aparelho
  // atual recebe um token novo e segue logado.
  const accessToken = await rotateSessionsAndIssueToken(userId);
  await UserDeviceSession.destroy({ where: { userId, isCurrent: false } });

  return { success: true, accessToken };
};

export const revokeOtherSessions = async (userId) => {
  await UserDeviceSession.destroy({
    where: {
      userId,
      isCurrent: false
    }
  });

  const accessToken = await rotateSessionsAndIssueToken(userId);
  return { success: true, accessToken };
};
