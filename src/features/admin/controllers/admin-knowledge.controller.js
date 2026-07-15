import * as adminKnowledgeService from '../services/admin-knowledge.service.js';
import catchAsync from '../../../utils/catch-async.js';
import { sendSuccess, sendCreated, sendEmpty } from '../../../utils/api-response.js';
import AppError from '../../../utils/app-error.js';

export const getKnowledge = catchAsync(async (req, res, next) => {
  const list = await adminKnowledgeService.listKnowledge();
  return sendSuccess(res, list, 'Todos os tópicos da biblioteca.');
});

export const createKnowledge = catchAsync(async (req, res, next) => {
  const { topicTitle, category, content } = req.body;

  if (!topicTitle || !category) {
    return next(new AppError('topicTitle e category são obrigatórios.', 400, 'BAD_REQUEST'));
  }

  const knowledge = await adminKnowledgeService.createKnowledge({ topicTitle, category, content });
  return sendCreated(res, knowledge, 'Tópico de conhecimento criado.');
});

export const updateKnowledge = catchAsync(async (req, res) => {
  const knowledge = await adminKnowledgeService.updateKnowledge(req.params.id, req.body);
  return sendSuccess(res, knowledge, 'Tópico de conhecimento atualizado.');
});

export const deleteKnowledge = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  await adminKnowledgeService.deleteKnowledge(id);
  return sendEmpty(res, 204);
});
