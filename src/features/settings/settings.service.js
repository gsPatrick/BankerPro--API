import { UserDeviceSession } from '../../models/index.js';
import AppError from '../../utils/app-error.js';
import { parseUserAgent } from '../../utils/user-agent.js';

export const listSessions = async (userId) => {
  const rows = await UserDeviceSession.findAll({
    where: { userId },
    order: [['lastSeenAt', 'DESC'], ['createdAt', 'DESC']]
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

  return UserDeviceSession.create({
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
  return { success: true };
};

export const revokeOtherSessions = async (userId) => {
  await UserDeviceSession.destroy({
    where: {
      userId,
      isCurrent: false
    }
  });
  return { success: true };
};
