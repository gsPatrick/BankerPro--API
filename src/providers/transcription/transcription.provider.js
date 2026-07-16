import fs from 'fs';
import path from 'path';
import { getSettingValue } from '../../utils/settings-resolver.js';
import AppError from '../../utils/app-error.js';

/**
 * Transcrição de áudio: o único passo da Análise de Áudio que não roda no Claude,
 * porque a API da Anthropic não recebe som — só texto, imagem e PDF.
 *
 * Fica isolado atrás desta função de propósito: trocar de serviço (Whisper
 * self-hosted, Groq, Deepgram) deve ser mexer só neste arquivo.
 */

// O Whisper recusa acima de 25MB. Barramos antes de subir o arquivo para não
// gastar upload e devolver um erro genérico da OpenAI ao usuário.
export const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

const MIME_POR_EXTENSAO = {
  '.mp3': 'audio/mpeg',
  '.mp4': 'audio/mp4',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.oga': 'audio/ogg',
  '.opus': 'audio/ogg',
  '.wav': 'audio/wav',
  '.webm': 'audio/webm',
  '.mpeg': 'audio/mpeg',
  '.mpga': 'audio/mpeg'
};

/**
 * @param {string} filePath  caminho do áudio no disco
 * @returns {Promise<string>} a transcrição em texto
 */
export const transcribeAudio = async (filePath) => {
  const apiKey = await getSettingValue('OPENAI_API_KEY');
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    throw new AppError(
      'A transcrição de áudio não está configurada. Cadastre a OPENAI_API_KEY nas configurações do painel administrativo.',
      503,
      'TRANSCRIPTION_NOT_CONFIGURED'
    );
  }

  const { size } = await fs.promises.stat(filePath);
  if (size > MAX_AUDIO_BYTES) {
    throw new AppError(
      `O áudio tem ${(size / 1024 / 1024).toFixed(1)}MB e o limite é 25MB. Envie um trecho menor da negociação.`,
      400,
      'AUDIO_TOO_LARGE'
    );
  }

  const fileName = path.basename(filePath);
  const mimeType = MIME_POR_EXTENSAO[path.extname(filePath).toLowerCase()] || 'audio/mpeg';
  const buffer = await fs.promises.readFile(filePath);

  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mimeType }), fileName);
  form.append('model', 'whisper-1');
  // A negociação é em português: fixar o idioma evita o Whisper "adivinhar"
  // errado em áudio ruidoso e devolver a transcrição em outra língua.
  form.append('language', 'pt');

  let response;
  try {
    response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form
    });
  } catch (error) {
    throw new AppError(
      `Falha de comunicação com o serviço de transcrição: ${error.message}`,
      502,
      'TRANSCRIPTION_FAILED'
    );
  }

  if (!response.ok) {
    const detalhe = await response.text().catch(() => '');
    console.error('Erro na transcrição de áudio:', response.status, detalhe);
    if (response.status === 401) {
      throw new AppError(
        'A chave da OpenAI cadastrada foi recusada. Confira a OPENAI_API_KEY nas configurações do painel administrativo.',
        502,
        'TRANSCRIPTION_UNAUTHORIZED'
      );
    }
    throw new AppError(
      'Não foi possível transcrever o áudio. Tente novamente em instantes.',
      502,
      'TRANSCRIPTION_FAILED'
    );
  }

  const data = await response.json();
  const texto = (data?.text || '').trim();

  if (!texto) {
    throw new AppError(
      'Não conseguimos identificar fala neste áudio. Verifique se a gravação tem som e tente novamente.',
      400,
      'AUDIO_EMPTY'
    );
  }

  return texto;
};
