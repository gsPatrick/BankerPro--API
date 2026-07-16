/**
 * Cache em memória com validade curta, para dados lidos em quase toda request
 * (planos, chaves de API) que quase nunca mudam. Cada worker do cluster tem o
 * seu próprio cache; por isso a validade é curta: uma alteração feita pelo admin
 * se propaga a todos os workers dentro do TTL, sem precisar de invalidação
 * coordenada entre processos.
 *
 * `Date.now()` não é usado em nenhum outro lugar do projeto; aqui é aceitável
 * porque é só medição de validade de cache, não lógica de negócio.
 */
/**
 * Cache de valor único, para dados sem chave (ex.: a base de conhecimento
 * inteira). `holder` é um objeto { data, expires } que o chamador mantém.
 */
export const getCached = async (holder, ttlMs, loader) => {
  if (holder.data !== null && holder.data !== undefined && holder.expires > Date.now()) {
    return holder.data;
  }
  const value = await loader();
  holder.data = value;
  holder.expires = Date.now() + ttlMs;
  return value;
};

export const createTtlCache = (ttlMs) => {
  const store = new Map();

  return {
    /**
     * Retorna o valor cacheado; se expirou ou não existe, chama `loader`,
     * guarda o resultado e o devolve. Valores nulos/undefined não são cacheados
     * para não fixar um "miss" (ex.: chave ainda não cadastrada).
     */
    async get(key, loader) {
      const hit = store.get(key);
      if (hit && hit.expires > Date.now()) {
        return hit.value;
      }

      const value = await loader();
      if (value !== null && value !== undefined) {
        store.set(key, { value, expires: Date.now() + ttlMs });
      }
      return value;
    },

    // Chamado quando o dado muda, para o worker que fez a alteração já refletir
    // na hora, sem esperar o TTL.
    invalidate(key) {
      store.delete(key);
    },

    clear() {
      store.clear();
    }
  };
};
