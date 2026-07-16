import IORedis from 'ioredis';

/**
 * Conexão Redis para a fila (BullMQ). A regra de ouro aqui é: se o Redis não
 * estiver configurado, NADA disto é criado — nenhuma conexão, nenhum erro. A
 * fila é uma camada opcional por cima; sem ela, o sistema roda no modo síncrono
 * de sempre. Isso garante que um deploy sem Redis (ou com Redis fora do ar) não
 * derrube a API.
 */

// Considera o Redis configurado se houver uma URL ou um host explícito.
export const isQueueEnabled = () =>
  Boolean(process.env.REDIS_URL || process.env.REDIS_HOST);

let connection = null;

/**
 * Conexão compartilhada, criada só na primeira vez que a fila precisar dela e
 * só quando o Redis está configurado. O BullMQ exige `maxRetriesPerRequest:
 * null` para não abortar comandos quando o Redis pisca.
 */
export const getRedisConnection = () => {
  if (!isQueueEnabled()) return null;
  if (connection) return connection;

  const options = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  };

  connection = process.env.REDIS_URL
    ? new IORedis(process.env.REDIS_URL, options)
    : new IORedis({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
        ...options
      });

  // Um Redis fora do ar não deve derrubar o processo: loga e o BullMQ tenta
  // reconectar sozinho. Enquanto isso, os produtores que falharem ao enfileirar
  // caem no modo síncrono (tratado em quem chama).
  connection.on('error', (err) => {
    console.error('⚠️ Erro na conexão com o Redis (fila):', err.message);
  });

  return connection;
};

export const closeRedisConnection = async () => {
  if (connection) {
    await connection.quit().catch(() => {});
    connection = null;
  }
};
