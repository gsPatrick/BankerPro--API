import * as audioAnalysisService from './audio-analysis.service.js';
import { enqueuePainelAnalysis } from '../../queues/audio.queue.js';
import catchAsync from '../../utils/catch-async.js';
import { sendSuccess, sendCreated } from '../../utils/api-response.js';
import AppError from '../../utils/app-error.js';

export const createAnalysis = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Envie o arquivo de áudio da negociação.', 400, 'AUDIO_REQUIRED'));
  }

  const duration = Number(req.body?.durationSeconds);
  const durationSeconds = Number.isFinite(duration) && duration > 0 ? Math.round(duration) : null;
  const contexto = req.body?.contexto || null;

  // Com a fila: cria a linha 'processing', enfileira e responde na hora — o
  // usuário não fica 30-90s esperando, e uma rajada de áudios não trava a API.
  const pendente = await audioAnalysisService.createPendingAnalysis(req.user.id, {
    durationSeconds,
    source: 'painel'
  });

  const job = await enqueuePainelAnalysis({
    analysisId: pendente.id,
    filePath: req.file.path,
    contexto
  });

  if (job) {
    return sendCreated(res, pendente, 'Áudio recebido. A análise está sendo gerada.');
  }

  // Sem fila (Redis indisponível): completa de forma síncrona, como antes, para
  // nada deixar de funcionar. A mesma linha pendente é preenchida.
  await audioAnalysisService.completePendingAnalysis(pendente.id, req.file.path, { contexto });
  const concluida = await audioAnalysisService.getAnalysis(req.user.id, pendente.id);
  return sendCreated(res, concluida, 'Análise da negociação concluída.');
});

export const getAnalyses = catchAsync(async (req, res) => {
  const lista = await audioAnalysisService.listAnalyses(req.user.id);
  return sendSuccess(res, lista, 'Histórico de análises de áudio.');
});

export const getAnalysis = catchAsync(async (req, res) => {
  const analise = await audioAnalysisService.getAnalysis(req.user.id, req.params.id);
  return sendSuccess(res, analise, 'Análise da negociação.');
});

export const deleteAnalysis = catchAsync(async (req, res) => {
  const resultado = await audioAnalysisService.deleteAnalysis(req.user.id, req.params.id);
  return sendSuccess(res, resultado, 'Análise removida.');
});
