import * as knowledgeService from './product-knowledge.service.js';
import catchAsync from '../../utils/catch-async.js';
import { sendSuccess, sendCreated, sendEmpty } from '../../utils/api-response.js';
import AppError from '../../utils/app-error.js';

export const getKnowledge = catchAsync(async (req, res, next) => {
  const list = await knowledgeService.listKnowledge();
  return sendSuccess(res, list, 'Base de conhecimento de produtos.');
});

export const createKnowledge = catchAsync(async (req, res, next) => {
  const { topicTitle, category, content } = req.body;

  if (!topicTitle || !category) {
    return next(new AppError('topicTitle e category são obrigatórios.', 400, 'BAD_REQUEST'));
  }

  const knowledge = await knowledgeService.createKnowledge({ topicTitle, category, content });
  return sendCreated(res, knowledge, 'Tópico de conhecimento criado.');
});

export const deleteKnowledge = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  await knowledgeService.deleteKnowledge(id);
  return sendEmpty(res, 204);
});
