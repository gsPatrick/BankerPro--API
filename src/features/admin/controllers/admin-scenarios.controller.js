import * as adminScenariosService from '../services/admin-scenarios.service.js';
import catchAsync from '../../../utils/catch-async.js';
import { sendSuccess } from '../../../utils/api-response.js';
import AppError from '../../../utils/app-error.js';

export const getScenarios = catchAsync(async (req, res, next) => {
  const list = await adminScenariosService.listScenarios();
  return sendSuccess(res, list, 'Todos os cenários de atendimento.');
});

export const createScenario = catchAsync(async (req, res, next) => {
  const { title, category, difficulty, clientPersona, clientName, openingMessage } = req.body;

  if (!title || !category || !difficulty || !clientPersona || !clientName || !openingMessage) {
    return next(new AppError('Campos obrigatórios de cenário ausentes.', 400, 'BAD_REQUEST'));
  }

  const scenario = await adminScenariosService.createScenario(req.body);
  return sendSuccess(res, scenario, 'Cenário comercial criado com sucesso.', 201);
});

export const updateScenario = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const scenario = await adminScenariosService.updateScenario(id, req.body);
  return sendSuccess(res, scenario, 'Cenário comercial atualizado.');
});

export const deleteScenario = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  await adminScenariosService.deleteScenario(id);
  return sendSuccess(res, { success: true }, 'Cenário comercial removido.');
});
