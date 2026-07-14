import * as goalService from './goal.service.js';
import catchAsync from '../../utils/catch-async.js';
import { sendSuccess, sendCreated, sendEmpty } from '../../utils/api-response.js';
import AppError from '../../utils/app-error.js';

export const getGoals = catchAsync(async (req, res, next) => {
  const goals = await goalService.listGoals(req.user.id);
  return sendSuccess(res, goals, 'Lista de metas de vendas.');
});

export const createGoal = catchAsync(async (req, res, next) => {
  const { label, target } = req.body;

  if (!label || label.trim() === '') {
    return next(new AppError('Descrição da meta (label) é obrigatória.', 400, 'BAD_REQUEST'));
  }

  const goal = await goalService.createGoal(req.user.id, {
    label,
    target: target !== undefined ? parseInt(target, 10) : 0,
    achieved: req.body.achieved !== undefined ? parseInt(req.body.achieved, 10) : 0
  });

  return sendCreated(res, goal, 'Meta de venda criada.');
});

export const updateGoal = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const goal = await goalService.updateGoal(req.user.id, id, req.body);
  return sendSuccess(res, goal, 'Meta atualizada com sucesso.');
});

export const deleteGoal = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  await goalService.deleteGoal(req.user.id, id);
  return sendEmpty(res, 204);
});
