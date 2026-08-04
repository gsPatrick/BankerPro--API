import { Op } from 'sequelize';
import { Client } from '../../models/index.js';
import AppError from '../../utils/app-error.js';

export const listClients = async (userId, { status, search }) => {
  const where = { createdByUserId: userId };

  if (status && status !== 'Todos') {
    where.status = status;
  }

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { objective: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const clients = await Client.findAll({
    where,
    order: [['created_at', 'DESC']]
  });

  return clients;
};

// Mesmos campos que o update aceita. Criar precisa da mesma lista: o controller
// entrega o req.body inteiro, e espalhá-lo sobre o objeto deixava o cliente
// escolher QUALQUER coluna — inclusive o dono do registro.
const CAMPOS_CLIENTE = [
  'name', 'phone', 'whatsapp', 'objective', 'approximateIncome',
  'offeredProduct', 'status', 'lastContact', 'nextReturn', 'notes'
];

export const createClient = async (userId, data) => {
  const permitidos = {};
  CAMPOS_CLIENTE.forEach((campo) => {
    if (data[campo] !== undefined) permitidos[campo] = data[campo];
  });

  const client = await Client.create({
    ...permitidos,
    // Dono por último e sempre do token: com o spread depois, mandar
    // "created_by_id" no corpo (que o conversor de chaves traduz para
    // createdByUserId) fazia o registro nascer na carteira de outra pessoa.
    createdByUserId: userId
  });
  return client;
};

export const updateClient = async (userId, clientId, data) => {
  const client = await Client.findOne({
    where: { id: clientId, createdByUserId: userId }
  });

  if (!client) {
    throw new AppError('Cliente não encontrado ou não pertence a você.', 404, 'CLIENT_NOT_FOUND');
  }

  const allowedFields = [
    'name', 'phone', 'whatsapp', 'objective', 'approximateIncome',
    'offeredProduct', 'status', 'lastContact', 'nextReturn', 'notes'
  ];

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      client[field] = data[field];
    }
  });

  await client.save();
  return client;
};

export const deleteClient = async (userId, clientId) => {
  const client = await Client.findOne({
    where: { id: clientId, createdByUserId: userId }
  });

  if (!client) {
    throw new AppError('Cliente não encontrado ou não pertence a você.', 404, 'CLIENT_NOT_FOUND');
  }

  await client.destroy();
  return { success: true };
};
