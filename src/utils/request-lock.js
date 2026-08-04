import { getCacheConnection } from '../config/redis.js';

/**
 * Trava de curta duração para serializar ações do MESMO usuário na MESMA
 * funcionalidade.
 *
 * Existe por causa de uma corrida no controle de limite de plano: o middleware
 * conta o uso e só depois a rota grava o registro. Disparando dez requisições ao
 * mesmo tempo, todas contam o mesmo valor antigo e todas passam — o teto de
 * "10 simulações" vira 20. É o padrão que se testa em bug bounty quando existe
 * qualquer contador (limite de plano, cupom, saque, convite).
 *
 * Com Redis ligado a trava vale para todos os workers do cluster. Sem Redis,
 * vale dentro do processo — o que já reduz a janela de "ilimitado" para, no
 * pior caso, uma passagem por worker.
 */

const travasLocais = new Map();

const limparLocal = (chave, expiraEm) => {
  const atual = travasLocais.get(chave);
  if (atual === expiraEm) travasLocais.delete(chave);
};

/**
 * Tenta adquirir a trava. Devolve uma função para liberar, ou null se já está
 * tomada por outra requisição.
 */
export const adquirirTrava = async (chave, ttlMs = 120_000) => {
  const redis = getCacheConnection();

  if (redis) {
    try {
      // SET com NX + PX: cria só se não existir e expira sozinho, então uma
      // requisição que morra no meio não deixa o usuário travado para sempre.
      const ok = await redis.set(`lock:${chave}`, '1', 'PX', ttlMs, 'NX');
      if (ok !== 'OK') return null;
      return async () => {
        try { await redis.del(`lock:${chave}`); } catch { /* a expiração resolve */ }
      };
    } catch {
      // Redis indisponível no meio do caminho: cai para a trava local em vez de
      // barrar o usuário.
    }
  }

  const agora = Date.now();
  const expiraEmAtual = travasLocais.get(chave);
  if (expiraEmAtual && expiraEmAtual > agora) return null;

  const expiraEm = agora + ttlMs;
  travasLocais.set(chave, expiraEm);
  return async () => limparLocal(chave, expiraEm);
};
