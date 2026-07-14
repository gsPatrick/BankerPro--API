import { Simulation, Scenario, UserProfile } from '../../models/index.js';
import AppError from '../../utils/app-error.js';

export const createSimulation = async (userId, { scenarioId }) => {
  const scenario = await Scenario.findByPk(scenarioId);
  if (!scenario) {
    throw new AppError('Cenário comercial não encontrado.', 404, 'SCENARIO_NOT_FOUND');
  }

  const initialMessages = [
    {
      role: 'client',
      content: scenario.openingMessage,
      timestamp: new Date().toISOString()
    }
  ];

  const simulation = await Simulation.create({
    scenarioId,
    scenarioTitle: scenario.title,
    scenarioCategory: scenario.category,
    createdByUserId: userId,
    status: 'in_progress',
    messages: initialMessages
  });

  return simulation;
};

export const getSimulationById = async (userId, id) => {
  const simulation = await Simulation.findOne({
    where: { id, createdByUserId: userId },
    include: [{ model: Scenario, as: 'scenario' }]
  });

  if (!simulation) {
    throw new AppError('Simulação não encontrada ou não pertence a você.', 404, 'SIMULATION_NOT_FOUND');
  }

  return simulation;
};

export const listSimulations = async (userId, { status }) => {
  const where = { createdByUserId: userId };
  if (status) {
    where.status = status;
  }

  const simulations = await Simulation.findAll({
    where,
    order: [['created_at', 'DESC']]
  });

  return simulations;
};

export const updateSimulation = async (userId, id, data) => {
  const simulation = await Simulation.findOne({
    where: { id, createdByUserId: userId }
  });

  if (!simulation) {
    throw new AppError('Simulação não encontrada ou não pertence a você.', 404, 'SIMULATION_NOT_FOUND');
  }

  // Se já estiver completada, não re-completar
  const wasAlreadyCompleted = simulation.status === 'completed';

  const fields = [
    'status', 'messages', 'durationMinutes',
    'scoreDiagnostico', 'scoreArgumentacao', 'scoreObjeccoes',
    'scoreCrossSell', 'scoreFechamento', 'scoreTotal',
    'pontosFortes', 'oportunidadesMelhoria', 'argumentosSugeridos', 'feedback'
  ];

  fields.forEach((field) => {
    if (data[field] !== undefined) {
      simulation[field] = data[field];
    }
  });

  await simulation.save();

  // Se mudou para completed agora, atualizar perfil do usuário
  if (simulation.status === 'completed' && !wasAlreadyCompleted) {
    const profile = await UserProfile.findOne({ where: { userId } });
    if (profile) {
      const scoreTotal = parseFloat(simulation.scoreTotal || 0.0);
      const prevTotal = profile.totalSimulations || 0;
      const nextTotal = prevTotal + 1;
      const prevAvg = parseFloat(profile.averageScore || 0.0);
      
      const newAvg = prevTotal === 0 ? scoreTotal : ((prevAvg * prevTotal) + scoreTotal) / nextTotal;
      const newBest = Math.max(parseFloat(profile.bestScore || 0.0), scoreTotal);

      profile.totalSimulations = nextTotal;
      profile.averageScore = Math.round(newAvg * 10) / 10;
      profile.bestScore = newBest;
      profile.weeklyCompleted = (profile.weeklyCompleted || 0) + 1;
      profile.xpPoints = (profile.xpPoints || 0) + Math.round(scoreTotal * 2);
      profile.lastActiveDate = new Date().toISOString().split('T')[0];

      await profile.save();
    }
  }

  return simulation;
};
