import { Queue } from 'bullmq';
import { isQueueEnabled, getRedisConnection } from '../config/redis.js';

/**
 * Fila do trabalho pesado de áudio. A fila só existe se o Redis estiver
 * configurado; sem ela, `enqueue*` devolve null e quem chama processa na hora.
 */
export const AUDIO_QUEUE_NAME = 'audio-analysis';

let queue = null;

const getQueue = () => {
  if (!isQueueEnabled()) return null;
  if (queue) return queue;

  queue = new Queue(AUDIO_QUEUE_NAME, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      // Sem retry: o áudio é apagado logo após a primeira transcrição (é
      // gravação de cliente real, não fica no servidor), então uma segunda
      // tentativa não teria o arquivo. Falhou, marca 'failed' e o usuário
      // reenvia. Manter o arquivo para permitir retry contrariaria a decisão de
      // apagá-lo na hora.
      attempts: 1,
      // Não deixa o Redis crescer sem fim guardando histórico de jobs.
      removeOnComplete: 200,
      removeOnFail: 500
    }
  });

  return queue;
};

/**
 * Enfileira a análise de um áudio enviado pelo painel. A linha do histórico já
 * foi criada como 'processing' pelo controller; aqui só passamos o id e o caminho
 * do arquivo. Devolve o job, ou null se a fila não estiver disponível — nesse
 * caso o controller processa de forma síncrona.
 */
export const enqueuePainelAnalysis = async (data) => {
  const q = getQueue();
  if (!q) return null;
  try {
    return await q.add('painel', data);
  } catch (err) {
    console.error('⚠️ Falha ao enfileirar análise do painel, caindo no modo síncrono:', err.message);
    return null;
  }
};

/**
 * Enfileira a análise de um áudio recebido no WhatsApp. Aqui o arquivo ainda não
 * foi baixado — o worker baixa a mídia, analisa e responde no chat.
 */
export const enqueueWhatsappAnalysis = async (data) => {
  const q = getQueue();
  if (!q) return null;
  try {
    return await q.add('whatsapp', data);
  } catch (err) {
    console.error('⚠️ Falha ao enfileirar análise do WhatsApp, caindo no modo síncrono:', err.message);
    return null;
  }
};

export const closeAudioQueue = async () => {
  if (queue) {
    await queue.close().catch(() => {});
    queue = null;
  }
};
