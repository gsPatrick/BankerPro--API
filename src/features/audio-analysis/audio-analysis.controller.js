import * as audioAnalysisService from './audio-analysis.service.js';
import catchAsync from '../../utils/catch-async.js';
import { sendSuccess, sendCreated } from '../../utils/api-response.js';
import AppError from '../../utils/app-error.js';

export const createAnalysis = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Envie o arquivo de áudio da negociação.', 400, 'AUDIO_REQUIRED'));
  }

  const duration = Number(req.body?.durationSeconds);

  const analise = await audioAnalysisService.analyzeAudio(req.user.id, {
    filePath: req.file.path,
    durationSeconds: Number.isFinite(duration) && duration > 0 ? Math.round(duration) : null,
    contexto: req.body?.contexto || null,
    source: 'painel'
  });

  return sendCreated(res, analise, 'Análise da negociação concluída.');
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
