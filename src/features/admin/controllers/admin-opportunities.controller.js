import * as opportunityService from '../../commercial-opportunity/commercial-opportunity.service.js';
import catchAsync from '../../../utils/catch-async.js';
import { sendSuccess, sendCreated } from '../../../utils/api-response.js';

export const getOpportunities = catchAsync(async (req, res) => {
  const { product, channel, tag, status, search } = req.query;
  const list = await opportunityService.listOpportunities({
    product,
    channel,
    tag,
    status,
    search,
    includeInactive: true,
  });
  return sendSuccess(res, list, 'Todas as oportunidades comerciais.');
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
