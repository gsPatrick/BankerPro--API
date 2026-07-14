import { Goal } from '../../models/index.js';
import AppError from '../../utils/app-error.js';

export const listGoals = async (userId) => {
  const goals = await Goal.findAll({
    where: { createdByUserId: userId },
    order: [['created_at', 'DESC']]
  });
  return goals;
};

export const createGoal = async (userId, data) => {
  const goal = await Goal.create({
    createdByUserId: userId,
    ...data
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

  const allowedFields = ['label', 'target', 'achieved'];
  allowedFields.forEach((field) => {
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
