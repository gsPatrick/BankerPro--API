import * as simulationService from './simulation.service.js';
import catchAsync from '../../utils/catch-async.js';
import { sendSuccess, sendCreated } from '../../utils/api-response.js';
import AppError from '../../utils/app-error.js';

export const createSimulation = catchAsync(async (req, res, next) => {
  const { scenarioId } = req.body;

  if (!scenarioId) {
    return next(new AppError('ID do cenário (scenarioId) é obrigatório.', 400, 'BAD_REQUEST'));
  }

  const simulation = await simulationService.createSimulation(req.user.id, { scenarioId });
  return sendCreated(res, simulation, 'Simulação de atendimento iniciada.');
});

export const getSimulation = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const simulation = await simulationService.getSimulationById(req.user.id, id);
  return sendSuccess(res, simulation, 'Detalhes da simulação.');
});

export const getSimulations = catchAsync(async (req, res, next) => {
  const { status } = req.query;
  const simulations = await simulationService.listSimulations(req.user.id, { status });
  return sendSuccess(res, simulations, 'Lista de simulações do usuário.');
});

export const updateSimulation = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const simulation = await simulationService.updateSimulation(req.user.id, id, req.body);
  return sendSuccess(res, simulation, 'Simulação atualizada com sucesso.');
});
