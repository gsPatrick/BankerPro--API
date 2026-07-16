import { Plan } from '../models/index.js';
import { createTtlCache } from './ttl-cache.js';

// Planos praticamente não mudam, mas eram consultados em toda checagem de
// permissão e em toda chamada de IA. Um cache de 60s tira essa query do caminho
// quente. A alteração feita pelo admin/Codex invalida o cache local na hora e
// chega aos demais workers em até 60s.
const cache = createTtlCache(60_000);

export const getPlanByKey = (key) => {
  if (!key) return Promise.resolve(null);
  return cache.get(key, () => Plan.findOne({ where: { key } }));
};

export const invalidatePlanCache = (key) => {
  if (key) cache.invalidate(key);
  else cache.clear();
};
