export const camelToSnake = (str) => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

export const snakeToCamel = (str) => {
  return str.replace(/([-_][a-z])/g, group =>
    group.toUpperCase().replace('-', '').replace('_', '')
  );
};

// Chaves que mexem na cadeia de protótipos do JavaScript. Este conversor roda em
// TODO req.body/query/params antes de qualquer rota, então uma chave dessas vinda
// de fora conseguiria injetar propriedades que os objetos passam a "herdar" —
// e checagens como `if (dados[campo] !== undefined)` enxergariam valores que o
// cliente nunca deveria conseguir definir. Hoje o snakeToCamel já desfigura
// "__proto__", mas depender disso é frágil: aqui a recusa é explícita.
const CHAVES_PROIBIDAS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * "É um objeto simples?" olhando o protótipo, e não `obj.constructor === Object`.
 * A diferença importa: um JSON com a chave "constructor" faz aquela comparação
 * falhar, e o objeto inteiro escapava sem conversão nem limpeza de chaves.
 */
const ehObjetoSimples = (valor) => {
  if (valor === null || typeof valor !== 'object') return false;
  const proto = Object.getPrototypeOf(valor);
  return proto === Object.prototype || proto === null;
};

export const toCamelCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(v => toCamelCase(v));
  } else if (ehObjetoSimples(obj)) {
    return Object.keys(obj).reduce((result, key) => {
      if (CHAVES_PROIBIDAS.has(key)) return result;

      let camelKey = snakeToCamel(key);
      if (CHAVES_PROIBIDAS.has(camelKey)) return result;
      
      // Mapear aliases de chaves do frontend para os campos do Sequelize
      if (camelKey === 'createdDate') {
        camelKey = 'createdAt';
      }
      if (camelKey === 'updatedDate') {
        camelKey = 'updatedAt';
      }
      if (camelKey === 'createdById') {
        // created_by_id mapeia especificamente para createdByUserId
        camelKey = 'createdByUserId';
      }
      
      result[camelKey] = toCamelCase(obj[key]);
      return result;
    }, {});
  }
  return obj;
};

export const toSnakeCase = (obj) => {
  if (!obj) return obj;

  // Se for modelo Sequelize, extrair objeto de dados cru
  if (typeof obj.toJSON === 'function') {
    obj = obj.toJSON();
  }

  if (Array.isArray(obj)) {
    return obj.map(v => toSnakeCase(v));
  } else if (ehObjetoSimples(obj)) {
    return Object.keys(obj).reduce((result, key) => {
      // Evitar converter chaves internas dentro de JSONs de mensagens do chat
      if (key === 'messages') {
        result['messages'] = obj['messages'];
        return result;
      }
      
      const snakeKey = camelToSnake(key);
      result[snakeKey] = toSnakeCase(obj[key]);

      // Mapear createdAt/updatedAt para os campos do frontend (created_date/updated_date)
      if (key === 'createdAt') {
        result['created_date'] = toSnakeCase(obj[key]);
      }
      if (key === 'updatedAt') {
        result['updated_date'] = toSnakeCase(obj[key]);
      }

      // Duplicar referências de usuário criador como aliases de compatibilidade
      if (key === 'createdByUserId') {
        result['created_by_id'] = toSnakeCase(obj[key]);
        result['user_id'] = toSnakeCase(obj[key]);
      }
      if (key === 'userId') {
        result['created_by_id'] = toSnakeCase(obj[key]);
        result['user_id'] = toSnakeCase(obj[key]);
      }
      
      return result;
    }, {});
  }
  return obj;
};
