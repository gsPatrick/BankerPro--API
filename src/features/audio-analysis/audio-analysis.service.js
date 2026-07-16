import fs from 'fs';
import { AudioAnalysis, ProductKnowledge } from '../../models/index.js';
import * as anthropicProvider from '../../providers/anthropic/anthropic.provider.js';
import { transcribeAudio } from '../../providers/transcription/transcription.provider.js';
import * as prompts from '../ai/ai.prompts.js';
import { getCached } from '../../utils/ttl-cache.js';
import AppError from '../../utils/app-error.js';

// A nota vem no meio do texto ("Nota: 7/10"). Guardá-la em coluna própria deixa
// o histórico listar e ordenar sem reprocessar o feedback inteiro.
const extrairNota = (analise) => {
  const match = analise.match(/nota[^\d]{0,15}(\d{1,2}(?:[.,]\d)?)\s*(?:\/\s*10)?/i);
  if (!match) return null;
  const nota = Number(String(match[1]).replace(',', '.'));
  return Number.isFinite(nota) && nota >= 0 && nota <= 10 ? nota : null;
};

// Um título curto para a listagem do histórico, tirado do começo da transcrição.
const montarTitulo = (transcricao) => {
  const limpo = transcricao.replace(/\s+/g, ' ').trim();
  if (limpo.length <= 60) return limpo;
  return `${limpo.slice(0, 57)}...`;
};

// A base de conhecimento muda raramente mas era lida inteira a cada análise.
// Cache curto tira essa query do caminho de toda transcrição.
const knowledgeCache = { data: null, expires: 0 };
const listKnowledge = () =>
  getCached(knowledgeCache, 60_000, () => ProductKnowledge.findAll());

// Só marca os produtos que a base de conhecimento conhece e que aparecem na
// conversa. Não é para a IA discutir o produto — é contexto de qual oferta
// estava em jogo.
const identificarProdutos = async (transcricao) => {
  const alvo = transcricao.toLowerCase();
  const topicos = await listKnowledge();
  const encontrados = new Set();

  for (const topico of topicos) {
    const categoria = String(topico.category || '').trim();
    if (categoria && alvo.includes(categoria.toLowerCase())) {
      encontrados.add(categoria);
    }
  }

  return encontrados.size > 0 ? Array.from(encontrados).join(', ') : null;
};

/**
 * Núcleo compartilhado: transcreve o áudio, pede a análise ao Claude e devolve os
 * campos prontos para gravar. O arquivo é SEMPRE apagado no fim — dê certo ou
 * errado — porque é gravação de negociação real com cliente. Não persiste nada:
 * quem chama decide se cria uma linha nova (WhatsApp) ou completa uma existente
 * (painel assíncrono).
 */
export const runTranscriptionAndAnalysis = async (filePath, { contexto } = {}) => {
  try {
    const transcricao = await transcribeAudio(filePath);
    const produtosIdentificados = await identificarProdutos(transcricao);

    const systemPrompt = await prompts.getAudioAnalysisPrompt({
      transcricao,
      produtosIdentificados,
      contexto
    });

    const analise = await anthropicProvider.invokeLLM({
      system: systemPrompt,
      messages: [],
      maxTokens: 4000
    });

    if (!analise || !analise.trim()) {
      throw new AppError(
        'A análise não pôde ser gerada. Tente novamente em instantes.',
        502,
        'AUDIO_ANALYSIS_FAILED'
      );
    }

    return {
      transcription: transcricao,
      analysis: analise.trim(),
      score: extrairNota(analise),
      title: montarTitulo(transcricao)
    };
  } finally {
    await fs.promises.unlink(filePath).catch(() => {
      // O arquivo pode já ter sumido; não é motivo para derrubar a análise.
    });
  }
};

// Cria a linha do histórico já em processamento, para o painel devolver um id na
// hora e o worker completá-la depois.
export const createPendingAnalysis = (userId, { durationSeconds, source = 'painel' } = {}) =>
  AudioAnalysis.create({
    createdByUserId: userId,
    status: 'processing',
    durationSeconds: durationSeconds ?? null,
    source
  });

// Chamada pelo worker: roda a análise e completa a linha pendente. Se falhar,
// marca a linha como 'failed' com uma mensagem amigável e repropaga o erro para
// o BullMQ decidir se tenta de novo.
export const completePendingAnalysis = async (analysisId, filePath, { contexto } = {}) => {
  try {
    const resultado = await runTranscriptionAndAnalysis(filePath, { contexto });
    await AudioAnalysis.update(
      { ...resultado, status: 'completed', errorMessage: null },
      { where: { id: analysisId } }
    );
  } catch (error) {
    await AudioAnalysis.update(
      {
        status: 'failed',
        errorMessage: error.isOperational ? error.message : 'Não foi possível analisar este áudio.'
      },
      { where: { id: analysisId } }
    ).catch(() => {});
    throw error;
  }
};

/**
 * Caminho síncrono (usado quando a fila não está disponível): transcreve,
 * analisa e grava a linha já completa, devolvendo-a. É o comportamento de antes
 * da fila — a rede de segurança que mantém tudo funcionando sem Redis.
 */
export const analyzeAudioSync = async (userId, { filePath, durationSeconds, contexto, source = 'painel' }) => {
  const resultado = await runTranscriptionAndAnalysis(filePath, { contexto });

  return AudioAnalysis.create({
    createdByUserId: userId,
    status: 'completed',
    ...resultado,
    durationSeconds: durationSeconds ?? null,
    source
  });
};

export const listAnalyses = async (userId) => {
  return AudioAnalysis.findAll({
    where: { createdByUserId: userId },
    order: [['created_at', 'DESC']]
  });
};

export const getAnalysis = async (userId, id) => {
  const analise = await AudioAnalysis.findOne({
    where: { id, createdByUserId: userId }
  });

  if (!analise) {
    throw new AppError('Análise não encontrada ou não pertence a você.', 404, 'AUDIO_ANALYSIS_NOT_FOUND');
  }

  return analise;
};

export const deleteAnalysis = async (userId, id) => {
  const analise = await getAnalysis(userId, id);
  await analise.destroy();
  return { success: true };
};
