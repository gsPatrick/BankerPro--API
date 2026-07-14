import * as adminSettingsService from '../services/admin-settings.service.js';
import catchAsync from '../../../utils/catch-async.js';
import { sendSuccess } from '../../../utils/api-response.js';
import AppError from '../../../utils/app-error.js';

export const getSettings = catchAsync(async (req, res, next) => {
  const settings = await adminSettingsService.listSettings();
  return sendSuccess(res, settings, 'Lista de configurações do sistema.');
});

export const saveSetting = catchAsync(async (req, res, next) => {
  const { key, value } = req.body;

  if (!key) {
    return next(new AppError('A chave da configuração (key) é obrigatória.', 400, 'BAD_REQUEST'));
  }

  const setting = await adminSettingsService.saveSetting(key, value);
  return sendSuccess(res, setting, 'Configuração salva com sucesso.');
});
