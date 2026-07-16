import { Op } from 'sequelize';
import { Scenario } from '../../models/index.js';
import { cacheRead, invalidateCache } from '../../utils/redis-cache.js';
import AppError from '../../utils/app-error.js';

const SCENARIOS_CACHE_KEY = 'scenarios:all';

const buscarCenarios = (where) =>
  Scenario.findAll({ where, order: [['created_at', 'DESC']] });

export const listScenarios = async ({ category, difficulty, search }) => {
  const where = {};

  if (category && category !== 'Todos') {
    where.category = category;
  }

  if (difficulty && difficulty !== 'Todos') {
    where.difficulty = difficulty;
  }

  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
      { clientName: { [Op.iLike]: `%${search}%` } }
    ];
  }

  // A biblioteca completa (sem filtro) é a leitura mais comum e é global — cacheia.
  // Com filtro/busca, cada combinação é diferente, então vai direto ao banco.
  const semFiltro = Object.keys(where).length === 0;
  if (semFiltro) {
    return cacheRead(SCENARIOS_CACHE_KEY, 60, () => buscarCenarios(where));
  }

  return buscarCenarios(where);
};

export const getScenarioById = async (id) => {
  const scenario = await Scenario.findByPk(id);
  if (!scenario) {
    throw new AppError('Cenário de atendimento não encontrado.', 404, 'SCENARIO_NOT_FOUND');
  }
  return scenario;
};

export const createScenario = async (data) => {
  const scenario = await Scenario.create(data);
  await invalidateCache(SCENARIOS_CACHE_KEY);
  return scenario;
};

export const updateScenario = async (id, data) => {
  const scenario = await Scenario.findByPk(id);
  if (!scenario) {
    throw new AppError('Cenário de atendimento não encontrado.', 404, 'SCENARIO_NOT_FOUND');
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
  await invalidateCache(SCENARIOS_CACHE_KEY);
  return scenario;
};

export const deleteScenario = async (id) => {
  const scenario = await Scenario.findByPk(id);
  if (!scenario) {
    throw new AppError('Cenário de atendimento não encontrado.', 404, 'SCENARIO_NOT_FOUND');
  }
  await scenario.destroy();
  await invalidateCache(SCENARIOS_CACHE_KEY);
  return { success: true };
};
