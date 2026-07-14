import * as scenarioService from './scenario.service.js';
import catchAsync from '../../utils/catch-async.js';
import { sendSuccess } from '../../utils/api-response.js';

export const getScenarios = catchAsync(async (req, res, next) => {
  const { category, difficulty, search } = req.query;
  const scenarios = await scenarioService.listScenarios({ category, difficulty, search });
  return sendSuccess(res, scenarios, 'Lista de cenários comerciais.');
});

export const getScenario = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const scenario = await scenarioService.getScenarioById(id);
  return sendSuccess(res, scenario, 'Detalhes do cenário comercial.');
});

export const createScenario = catchAsync(async (req, res, next) => {
  const { title, category, difficulty, clientPersona, clientName, openingMessage } = req.body;

  if (!title || !category || !difficulty || !clientPersona || !clientName || !openingMessage) {
    return next(new AppError('Campos obrigatórios de cenário ausentes.', 400, 'BAD_REQUEST'));
  }

  const scenario = await scenarioService.createScenario(req.body);
  return sendSuccess(res, scenario, 'Cenário comercial criado com sucesso.', 201);
});

export const updateScenario = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const scenario = await scenarioService.updateScenario(id, req.body);
  return sendSuccess(res, scenario, 'Cenário comercial atualizado.');
});

export const deleteScenario = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  await scenarioService.deleteScenario(id);
  return sendSuccess(res, { success: true }, 'Cenário comercial removido.');
});
