import fs from 'fs';
import { AudioAnalysis, ProductKnowledge } from '../../models/index.js';
import * as anthropicProvider from '../../providers/anthropic/anthropic.provider.js';
import { transcribeAudio } from '../../providers/transcription/transcription.provider.js';
import * as prompts from '../ai/ai.prompts.js';
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

// Só marca os produtos que a base de conhecimento conhece e que aparecem na
// conversa. Não é para a IA discutir o produto — é contexto de qual oferta
// estava em jogo.
const identificarProdutos = async (transcricao) => {
  const alvo = transcricao.toLowerCase();
  const topicos = await ProductKnowledge.findAll();
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
 * Transcreve o áudio, pede a análise ao Claude e guarda o histórico.
 * O arquivo é sempre apagado no fim, dê certo ou dê errado: é gravação de
 * negociação real com cliente e não deve ficar parada no servidor.
 */
export const analyzeAudio = async (userId, { filePath, durationSeconds, contexto, source = 'painel' }) => {
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

    return await AudioAnalysis.create({
      createdByUserId: userId,
      transcription: transcricao,
      analysis: analise.trim(),
      score: extrairNota(analise),
      title: montarTitulo(transcricao),
      durationSeconds: durationSeconds ?? null,
      source
    });
  } finally {
    await fs.promises.unlink(filePath).catch(() => {
      // O arquivo pode já ter sumido; não é motivo para derrubar a análise.
    });
  }
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
