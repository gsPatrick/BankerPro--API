import * as opportunityService from './commercial-opportunity.service.js';
import catchAsync from '../../utils/catch-async.js';
import { sendSuccess, sendCreated } from '../../utils/api-response.js';

export const getOpportunities = catchAsync(async (req, res) => {
  const { product, channel, tag, search } = req.query;
  const list = await opportunityService.listOpportunities({
    product,
    channel,
    tag,
    search,
    includeInactive: false,
  });
  return sendSuccess(res, list, 'Lista de oportunidades comerciais.');
});

export const getOpportunity = catchAsync(async (req, res) => {
  const opportunity = await opportunityService.getOpportunityById(req.params.id, {
    includeInactive: false,
  });
  return sendSuccess(res, opportunity, 'Detalhes da oportunidade comercial.');
});

export const createOpportunity = catchAsync(async (req, res) => {
  const opportunity = await opportunityService.createOpportunity(req.body);
  return sendCreated(res, opportunity, 'Oportunidade comercial criada.');
});

export const updateOpportunity = catchAsync(async (req, res) => {
  const opportunity = await opportunityService.updateOpportunity(
    req.params.id,
    req.body
  );
  return sendSuccess(res, opportunity, 'Oportunidade comercial atualizada.');
});

export const deleteOpportunity = catchAsync(async (req, res) => {
  await opportunityService.deleteOpportunity(req.params.id);
  return sendSuccess(res, { success: true }, 'Oportunidade comercial removida.');
});
