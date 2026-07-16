import { Worker } from 'bullmq';
import { isQueueEnabled, getRedisConnection } from '../config/redis.js';
import { AUDIO_QUEUE_NAME } from '../queues/audio.queue.js';
import { completePendingAnalysis } from '../features/audio-analysis/audio-analysis.service.js';
import { processWhatsappAudioJob } from '../features/whatsapp/whatsapp.service.js';

/**
 * Consome a fila de áudio. Roda só no processo primário do cluster (que não
 * atende HTTP), então o trabalho pesado não disputa com as requests dos usuários.
 *
 * A concorrência é o freio que protege a máquina: no máximo N áudios processam
 * ao mesmo tempo. Uma rajada não pica os núcleos — o excedente espera na fila.
 */
let worker = null;

export const startAudioWorker = () => {
  if (!isQueueEnabled()) {
    console.log('ℹ️ Redis não configurado: análise de áudio roda em modo síncrono (sem fila).');
    return null;
  }
  if (worker) return worker;

  const concurrency = Math.max(1, parseInt(process.env.AUDIO_WORKER_CONCURRENCY || '2', 10));

  worker = new Worker(
    AUDIO_QUEUE_NAME,
    async (job) => {
      if (job.name === 'painel') {
        const { analysisId, filePath, contexto } = job.data;
        await completePendingAnalysis(analysisId, filePath, { contexto });
        return;
      }
      if (job.name === 'whatsapp') {
        await processWhatsappAudioJob(job.data);
        return;
      }
      throw new Error(`Tipo de job de áudio desconhecido: ${job.name}`);
    },
    {
      connection: getRedisConnection(),
      concurrency
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`❌ Job de áudio ${job?.id} (${job?.name}) falhou: ${err.message}`);
  });

  console.log(`🎧 Worker de análise de áudio ativo (concorrência ${concurrency}).`);
  return worker;
};

export const stopAudioWorker = async () => {
  if (worker) {
    await worker.close().catch(() => {});
    worker = null;
  }
};
