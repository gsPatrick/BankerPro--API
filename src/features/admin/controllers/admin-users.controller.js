import * as adminUsersService from '../services/admin-users.service.js';
import catchAsync from '../../../utils/catch-async.js';
import { sendSuccess } from '../../../utils/api-response.js';
import AppError from '../../../utils/app-error.js';

export const getUsers = catchAsync(async (req, res, next) => {
  const users = await adminUsersService.listUsers();
  return sendSuccess(res, users, 'Lista de usuários cadastrados.');
});

export const updateUserRole = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role) {
    return next(new AppError('O campo role é obrigatório.', 400, 'BAD_REQUEST'));
  }

  const user = await adminUsersService.updateUserRole(id, role);
  return sendSuccess(res, user, 'Função do usuário atualizada.');
});

export const updateUserStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (isActive === undefined) {
    return next(new AppError('O campo isActive é obrigatório.', 400, 'BAD_REQUEST'));
  }

  const user = await adminUsersService.updateUserStatus(id, isActive);
  return sendSuccess(res, user, 'Status do usuário atualizado.');
});

export const manualSubscription = catchAsync(async (req, res, next) => {
  const { id } = req.params; // userId
  const { planKey, durationDays } = req.body;

  if (!planKey) {
    return next(new AppError('O campo planKey é obrigatório.', 400, 'BAD_REQUEST'));
  }

  const subscription = await adminUsersService.manualSubscription(id, { planKey, durationDays });
  return sendSuccess(res, subscription, 'Assinatura atribuída manualmente.');
});

export const deleteUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  await adminUsersService.deleteUser(id);
  return sendSuccess(res, { success: true }, 'Usuário excluído com sucesso.');
});
