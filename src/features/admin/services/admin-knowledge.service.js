import { ProductKnowledge } from '../../../models/index.js';
import AppError from '../../../utils/app-error.js';

export const listKnowledge = async () => {
  return await ProductKnowledge.findAll({
    order: [['created_at', 'DESC']]
  });
};

export const createKnowledge = async (data) => {
  const knowledge = await ProductKnowledge.create(data);
  return knowledge;
};

export const deleteKnowledge = async (id) => {
  const knowledge = await ProductKnowledge.findByPk(id);
  if (!knowledge) {
    throw new AppError('Tópico de conhecimento não encontrado.', 404, 'KNOWLEDGE_NOT_FOUND');
  }
  await knowledge.destroy();
  return { success: true };
};
