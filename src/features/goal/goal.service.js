import { Op } from 'sequelize';
import { Goal } from '../../models/index.js';
import AppError from '../../utils/app-error.js';

// Mês de competência corrente no fuso de Brasília. Usar UTC viraria o mês três
// horas antes da meia-noite local e zeraria as metas ainda no dia 31.
export const currentPeriodMonth = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit'
  }).format(new Date());

// As metas são mensais: virou o mês, o realizado zera e o alvo permanece.
// O reset é feito na leitura, e não por agendamento, para que a virada aconteça
// mesmo que a API estivesse fora do ar na passagem do mês.
const syncGoalsPeriod = async (userId) => {
  const period = currentPeriodMonth();

  // Metas anteriores ao controle de competência adotam o mês atual sem perder
  // o progresso já registrado.
  await Goal.update(
    { periodMonth: period },
    { where: { createdByUserId: userId, periodMonth: null } }
  );

  await Goal.update(
    { achieved: 0, periodMonth: period },
    { where: { createdByUserId: userId, periodMonth: { [Op.ne]: period } } }
  );
};

export const listGoals = async (userId) => {
  await syncGoalsPeriod(userId);

  const goals = await Goal.findAll({
    where: { createdByUserId: userId },
    order: [['created_at', 'DESC']]
  });
  return goals;
};

export const createGoal = async (userId, data) => {
  const goal = await Goal.create({
    createdByUserId: userId,
    ...data,
    periodMonth: currentPeriodMonth()
  });
  return goal;
};

export const updateGoal = async (userId, goalId, data) => {
  const goal = await Goal.findOne({
    where: { id: goalId, createdByUserId: userId }
  });

  if (!goal) {
    throw new AppError('Meta não encontrada ou não pertence a você.', 404, 'GOAL_NOT_FOUND');
  }

  // Meta parada no mês anterior: o realizado que chega foi somado em cima do mês
  // que fechou, então zera e ignora o valor recebido em vez de carregar o total
  // antigo para o mês novo.
  const period = currentPeriodMonth();
  const isStalePeriod = Boolean(goal.periodMonth) && goal.periodMonth !== period;
  if (isStalePeriod) {
    goal.achieved = 0;
  }
  goal.periodMonth = period;

  const allowedFields = ['label', 'target', 'achieved'];
  allowedFields.forEach((field) => {
    if (isStalePeriod && field === 'achieved') return;
    if (data[field] !== undefined) {
      goal[field] = data[field];
    }
  });

  await goal.save();
  return goal;
};

export const deleteGoal = async (userId, goalId) => {
  const goal = await Goal.findOne({
    where: { id: goalId, createdByUserId: userId }
  });

  if (!goal) {
    throw new AppError('Meta não encontrada ou não pertence a você.', 404, 'GOAL_NOT_FOUND');
  }

  await goal.destroy();
  return { success: true };
};
