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

export const listGoals = async (userId) => {
  const period = currentPeriodMonth();

  const goals = await Goal.findAll({
    where: { createdByUserId: userId },
    order: [['created_at', 'DESC']]
  });

  // As metas são mensais: virou o mês, o realizado zera e o alvo permanece. O
  // reset acontece na leitura (não por agendamento) para funcionar mesmo se a
  // API estivesse fora do ar na virada. Antes isto disparava dois UPDATEs em
  // TODA leitura; agora só grava as metas realmente vencidas — no caso comum
  // (todas no mês corrente), zero escrita, e a leitura de metas volta a ser só
  // leitura, o que importa quando ela é chamada o tempo todo por muitos usuários.
  const vencidas = goals.filter((goal) => goal.periodMonth !== period);
  if (vencidas.length > 0) {
    await Promise.all(vencidas.map((goal) => {
      // periodMonth nulo = meta anterior ao controle de competência: adota o mês
      // atual sem perder o progresso. Mês antigo = virada real: zera o realizado.
      if (goal.periodMonth) goal.achieved = 0;
      goal.periodMonth = period;
      return goal.save();
    }));
  }

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
