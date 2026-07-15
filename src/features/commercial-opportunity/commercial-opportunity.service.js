import { Op } from 'sequelize';
import { CommercialOpportunity } from '../../models/index.js';
import {
  OpportunityProducts,
  OpportunityChannels,
  OpportunityStatuses,
} from '../../config/constants.js';
import AppError from '../../utils/app-error.js';

const ALLOWED_FIELDS = [
  'title',
  'product',
  'alternativeProduct',
  'clientProfile',
  'ageRange',
  'incomeRange',
  'balanceRange',
  'recommendedChannel',
  'objective',
  'openingScript',
  'diagnosticQuestions',
  'mainArgument',
  'objections',
  'objectionResponses',
  'fallbackPlan',
  'closingScript',
  'tags',
  'status',
];

function asStringArray(value) {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/\n|;/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizePayload(data = {}) {
  const payload = {};

  ALLOWED_FIELDS.forEach((field) => {
    if (data[field] !== undefined) {
      payload[field] = data[field];
    }
  });

  // Aceita snake_case do Codex
  const aliases = {
    alternative_product: 'alternativeProduct',
    client_profile: 'clientProfile',
    age_range: 'ageRange',
    income_range: 'incomeRange',
    balance_range: 'balanceRange',
    recommended_channel: 'recommendedChannel',
    opening_script: 'openingScript',
    diagnostic_questions: 'diagnosticQuestions',
    main_argument: 'mainArgument',
    objection_responses: 'objectionResponses',
    fallback_plan: 'fallbackPlan',
    closing_script: 'closingScript',
  };

  Object.entries(aliases).forEach(([snake, camel]) => {
    if (data[snake] !== undefined && payload[camel] === undefined) {
      payload[camel] = data[snake];
    }
  });

  if (payload.diagnosticQuestions !== undefined) {
    payload.diagnosticQuestions = asStringArray(payload.diagnosticQuestions);
  }
  if (payload.objections !== undefined) {
    payload.objections = asStringArray(payload.objections);
  }
  if (payload.objectionResponses !== undefined) {
    payload.objectionResponses = asStringArray(payload.objectionResponses);
  }
  if (payload.tags !== undefined) {
    payload.tags = asStringArray(payload.tags);
  }

  return payload;
}

function validateWrite(payload, { partial = false } = {}) {
  if (!partial || payload.title !== undefined) {
    if (!payload.title || !String(payload.title).trim()) {
      throw new AppError('title é obrigatório.', 400, 'BAD_REQUEST');
    }
  }

  if (!partial || payload.product !== undefined) {
    if (!OpportunityProducts.includes(payload.product)) {
      throw new AppError(
        `product inválido. Use: ${OpportunityProducts.join(', ')}`,
        400,
        'BAD_REQUEST'
      );
    }
  }

  if (payload.recommendedChannel !== undefined) {
    if (!OpportunityChannels.includes(payload.recommendedChannel)) {
      throw new AppError(
        `recommendedChannel inválido. Use: ${OpportunityChannels.join(', ')}`,
        400,
        'BAD_REQUEST'
      );
    }
  }

  if (payload.status !== undefined) {
    if (!OpportunityStatuses.includes(payload.status)) {
      throw new AppError(
        `status inválido. Use: ${OpportunityStatuses.join(', ')}`,
        400,
        'BAD_REQUEST'
      );
    }
  }
}

export const listOpportunities = async ({
  product,
  channel,
  tag,
  status,
  search,
  includeInactive = false,
} = {}) => {
  const where = {};

  if (product && product !== 'Todos') {
    where.product = product;
  }

  if (channel && channel !== 'Todos') {
    where.recommendedChannel = channel;
  }

  if (tag) {
    where.tags = { [Op.contains]: [String(tag).trim()] };
  }

  if (status) {
    where.status = status;
  } else if (!includeInactive) {
    where.status = 'Ativo';
  }

  if (search) {
    const term = `%${search}%`;
    where[Op.or] = [
      { title: { [Op.iLike]: term } },
      { clientProfile: { [Op.iLike]: term } },
      { objective: { [Op.iLike]: term } },
      { product: { [Op.iLike]: term } },
    ];
  }

  return CommercialOpportunity.findAll({
    where,
    order: [['created_at', 'DESC']],
  });
};

export const getOpportunityById = async (id, { includeInactive = false } = {}) => {
  const opportunity = await CommercialOpportunity.findByPk(id);
  if (!opportunity) {
    throw new AppError('Oportunidade não encontrada.', 404, 'OPPORTUNITY_NOT_FOUND');
  }
  if (!includeInactive && opportunity.status !== 'Ativo') {
    throw new AppError('Oportunidade não encontrada.', 404, 'OPPORTUNITY_NOT_FOUND');
  }
  return opportunity;
};

export const createOpportunity = async (data) => {
  const payload = normalizePayload(data);
  if (!payload.recommendedChannel) payload.recommendedChannel = 'Ligação';
  if (!payload.status) payload.status = 'Ativo';
  if (!payload.diagnosticQuestions) payload.diagnosticQuestions = [];
  if (!payload.objections) payload.objections = [];
  if (!payload.objectionResponses) payload.objectionResponses = [];
  if (!payload.tags) payload.tags = [];

  validateWrite(payload, { partial: false });
  return CommercialOpportunity.create(payload);
};

export const updateOpportunity = async (id, data) => {
  const opportunity = await CommercialOpportunity.findByPk(id);
  if (!opportunity) {
    throw new AppError('Oportunidade não encontrada.', 404, 'OPPORTUNITY_NOT_FOUND');
  }

  const payload = normalizePayload(data);
  validateWrite(payload, { partial: true });

  ALLOWED_FIELDS.forEach((field) => {
    if (payload[field] !== undefined) {
      opportunity[field] = payload[field];
    }
  });

  await opportunity.save();
  return opportunity;
};

export const deleteOpportunity = async (id) => {
  const opportunity = await CommercialOpportunity.findByPk(id);
  if (!opportunity) {
    throw new AppError('Oportunidade não encontrada.', 404, 'OPPORTUNITY_NOT_FOUND');
  }
  await opportunity.destroy();
  return { success: true };
};
