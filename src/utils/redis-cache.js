import { getCacheConnection } from '../config/redis.js';

/**
 * Cache de leitura compartilhado entre todos os workers, via Redis. Serve para
 * leituras que se repetem muito e mudam pouco (ranking, lista de cenários, lista
 * de planos): a primeira busca vai ao banco, as seguintes vêm do Redis em
 * sub-milissegundo.
 *
 * Regra de ouro (igual à fila): se o Redis não estiver configurado ou estiver
 * fora do ar, isto NUNCA quebra nem trava — cai direto no banco (o comportamento
 * de sempre). A conexão de cache é configurada para falhar rápido justamente para
 * esse fallback ser instantâneo.
 *
 * @param {string} key           chave no Redis
 * @param {number} ttlSeconds    validade em segundos
 * @param {() => Promise<any>} loader  busca no banco quando não há cache
 */
export const cacheRead = async (key, ttlSeconds, loader) => {
  const redis = getCacheConnection();
  if (!redis) return loader(); // sem Redis: direto no banco

  try {
    const cached = await redis.get(key);
    if (cached !== null) return JSON.parse(cached);
  } catch {
    // Redis com problema: não segura a request, busca no banco.
    return loader();
  }

  const fresh = await loader();

  try {
    await redis.set(key, JSON.stringify(fresh), 'EX', ttlSeconds);
  } catch {
    // Não conseguiu gravar no cache: tudo bem, só não acelera desta vez.
  }

  // Devolve o valor já "achatado" (JSON) para ficar idêntico ao caminho do cache
  // hit — assim a resposta é a mesma esteja o dado no cache ou não.
  return JSON.parse(JSON.stringify(fresh));
};

export const invalidateCache = async (...keys) => {
  const redis = getCacheConnection();
  if (!redis || keys.length === 0) return;
  try {
    await redis.del(...keys);
  } catch {
    // Se não deu para invalidar agora, o TTL cuida da atualização em pouco tempo.
  }
};
