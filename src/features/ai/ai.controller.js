import * as aiService from './ai.service.js';
import catchAsync from '../../utils/catch-async.js';
import { sendSuccess, sendCreated } from '../../utils/api-response.js';
import AppError from '../../utils/app-error.js';

export const simulationChat = catchAsync(async (req, res, next) => {
  const { simulationId, userMessage } = req.body;

  if (!simulationId || !userMessage) {
    return next(new AppError('simulationId e userMessage são obrigatórios.', 400, 'BAD_REQUEST'));
  }

  const result = await aiService.simulationChat(req.user.id, { simulationId, userMessage });
  return sendSuccess(res, result, 'Resposta do cliente simulado.');
});

export const simulationEvaluate = catchAsync(async (req, res, next) => {
  const { simulationId, durationMinutes } = req.body;

  if (!simulationId) {
    return next(new AppError('simulationId é obrigatório.', 400, 'BAD_REQUEST'));
  }

  const result = await aiService.simulationEvaluate(req.user.id, {
    simulationId,
    durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : 0
  });
  return sendSuccess(res, result, 'Avaliação da simulação de atendimento concluída.');
});

export const simulationExtractLearning = catchAsync(async (req, res, next) => {
  const { simulationId, evaluation } = req.body;

  if (!simulationId || !evaluation) {
    return next(new AppError('simulationId e evaluation são obrigatórios.', 400, 'BAD_REQUEST'));
  }

  const learning = await aiService.simulationExtractLearning(req.user.id, { simulationId, evaluation });
  return sendCreated(res, learning, 'Lição comercial extraída e gravada com sucesso.');
});

export const copilotoAnalyze = catchAsync(async (req, res, next) => {
  const { situationText } = req.body;

  if (!situationText || situationText.trim() === '') {
    return next(new AppError('O relato da situação comercial (situationText) é obrigatório.', 400, 'BAD_REQUEST'));
  }

  const result = await aiService.copilotoAnalyze(req.user.id, { situationText });
  return sendSuccess(res, result, 'Análise estratégica do Copiloto concluída.');
});

export const approachGenerate = catchAsync(async (req, res, next) => {
  const { clientAge, clientIncome, objective, product } = req.body;

  if (!objective || !product) {
    return next(new AppError('objective e product são obrigatórios.', 400, 'BAD_REQUEST'));
  }

  const result = await aiService.approachGenerate({
    clientAge,
    clientIncome,
    objective,
    product
  });
  
  return sendSuccess(res, result, 'Roteiro de abordagem gerado com sucesso.');
});

export const knowledgePolish = catchAsync(async (req, res, next) => {
  const { topicTitle, category, content } = req.body;

  if (!topicTitle || !category || !content) {
    return next(new AppError('topicTitle, category e content são obrigatórios.', 400, 'BAD_REQUEST'));
  }

  const result = await aiService.knowledgePolish({ topicTitle, category, content });
  return sendSuccess(res, { polishedContent: result }, 'Conteúdo polido com sucesso.');
});

export const invokeLLM = catchAsync(async (req, res, next) => {
  const { prompt, messages, responseJsonSchema } = req.body;

  if (!prompt) {
    return next(new AppError('O prompt principal é obrigatório.', 400, 'BAD_REQUEST'));
  }

  const result = await aiService.genericInvokeLLM({ prompt, messages, responseJsonSchema });
  // Retorna diretamente o resultado formatado (que pode ser um JSON mapeado ou contendo { response: ... })
  return sendSuccess(res, result, 'LLM invocada com sucesso.');
});
