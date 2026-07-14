import * as rankingService from './ranking.service.js';
import catchAsync from '../../utils/catch-async.js';
import { sendSuccess } from '../../utils/api-response.js';

export const getRanking = catchAsync(async (req, res, next) => {
  const ranking = await rankingService.getRanking();
  return sendSuccess(res, ranking, 'Ranking geral de usuários por XP.');
});
