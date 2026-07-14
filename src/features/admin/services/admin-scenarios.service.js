import { Scenario } from '../../../models/index.js';
import AppError from '../../../utils/app-error.js';

export const listScenarios = async () => {
  return await Scenario.findAll({
    order: [['created_at', 'DESC']]
  });
};

export const createScenario = async (data) => {
  const scenario = await Scenario.create(data);
  return scenario;
};

export const updateScenario = async (id, data) => {
  const scenario = await Scenario.findByPk(id);
  if (!scenario) {
    throw new AppError('Cenário não encontrado.', 404, 'SCENARIO_NOT_FOUND');
  }

  const allowedFields = [
    'title', 'description', 'category', 'difficulty', 'clientPersona',
    'clientName', 'clientAge', 'clientProfile', 'openingMessage',
    'userObjective', 'commercialClues', 'mainProduct', 'supportProducts',
    'evaluationCriteria', 'tags'
  ];

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      scenario[field] = data[field];
    }
  });

  await scenario.save();
  return scenario;
};

export const deleteScenario = async (id) => {
  const scenario = await Scenario.findByPk(id);
  if (!scenario) {
    throw new AppError('Cenário não encontrado.', 404, 'SCENARIO_NOT_FOUND');
  }
  await scenario.destroy();
  return { success: true };
};
