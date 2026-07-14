import { SystemPrompt } from '../../../models/index.js';
import * as anthropicProvider from '../../../providers/anthropic/anthropic.provider.js';
import AppError from '../../../utils/app-error.js';

export const listPrompts = async () => {
  return await SystemPrompt.findAll({
    order: [['key', 'ASC']]
  });
};

export const updatePrompt = async (key, content) => {
  const prompt = await SystemPrompt.findOne({ where: { key } });
  if (!prompt) {
    throw new AppError(`Prompt '${key}' não encontrado no sistema.`, 404, 'PROMPT_NOT_FOUND');
  }

  prompt.content = content;
  await prompt.save();
  return prompt;
};

export const testPrompt = async ({ system, messages }) => {
  if (!system) {
    throw new AppError('O prompt de sistema (system) é obrigatório para testes.', 400, 'BAD_REQUEST');
  }

  const response = await anthropicProvider.invokeLLM({
    system,
    messages: messages || []
  });

  return { response };
};
