import * as adminPromptsService from '../services/admin-prompts.service.js';
import catchAsync from '../../../utils/catch-async.js';
import { sendSuccess } from '../../../utils/api-response.js';
import AppError from '../../../utils/app-error.js';

export const getPrompts = catchAsync(async (req, res, next) => {
  const prompts = await adminPromptsService.listPrompts();
  return sendSuccess(res, prompts, 'Lista de prompts de sistema.');
});

export const updatePrompt = catchAsync(async (req, res, next) => {
  const { key } = req.params;
  const { content } = req.body;

  if (content === undefined) {
    return next(new AppError('O corpo da requisição deve conter o campo content.', 400, 'BAD_REQUEST'));
  }

  const prompt = await adminPromptsService.updatePrompt(key, content);
  return sendSuccess(res, prompt, 'Prompt de sistema atualizado.');
});

export const testPrompt = catchAsync(async (req, res, next) => {
  const { system, messages } = req.body;
  const result = await adminPromptsService.testPrompt({ system, messages });
  return sendSuccess(res, result, 'Resultado do teste de prompt.');
});
