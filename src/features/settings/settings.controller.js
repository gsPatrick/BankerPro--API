import * as settingsService from './settings.service.js';
import catchAsync from '../../utils/catch-async.js';
import { sendSuccess } from '../../utils/api-response.js';
import { getClientIp } from '../../utils/user-agent.js';

export const listSessions = catchAsync(async (req, res) => {
  const sessions = await settingsService.listSessions(req.user.id);
  return sendSuccess(res, sessions, 'Sessões e dispositivos do usuário.');
});

export const pingSession = catchAsync(async (req, res) => {
  const userAgent = req.body?.userAgent || req.headers['user-agent'] || '';
  const ipAddress = getClientIp(req);
  const session = await settingsService.upsertSessionFromRequest(req.user.id, {
    userAgent,
    ipAddress,
    markCurrent: true
  });
  return sendSuccess(res, session, 'Sessão atualizada.');
});

export const revokeSession = catchAsync(async (req, res) => {
  const result = await settingsService.revokeSession(req.user.id, req.params.id);
  return sendSuccess(res, result, 'Sessão encerrada.');
});

export const revokeOtherSessions = catchAsync(async (req, res) => {
  const result = await settingsService.revokeOtherSessions(req.user.id);
  return sendSuccess(res, result, 'Outras sessões encerradas.');
});
