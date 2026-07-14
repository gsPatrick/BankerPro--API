import * as clientService from './client.service.js';
import catchAsync from '../../utils/catch-async.js';
import { sendSuccess, sendCreated, sendEmpty } from '../../utils/api-response.js';
import AppError from '../../utils/app-error.js';

export const getClients = catchAsync(async (req, res, next) => {
  const { status, search } = req.query;
  const clients = await clientService.listClients(req.user.id, { status, search });
  return sendSuccess(res, clients, 'Lista de clientes da carteira.');
});

export const createClient = catchAsync(async (req, res, next) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return next(new AppError('Nome do cliente é obrigatório.', 400, 'BAD_REQUEST'));
  }

  const client = await clientService.createClient(req.user.id, req.body);
  return sendCreated(res, client, 'Cliente cadastrado com sucesso.');
});

export const updateClient = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const client = await clientService.updateClient(req.user.id, id, req.body);
  return sendSuccess(res, client, 'Dados do cliente atualizados.');
});

export const deleteClient = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  await clientService.deleteClient(req.user.id, id);
  return sendEmpty(res, 204);
});
