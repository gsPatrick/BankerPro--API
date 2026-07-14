export const camelToSnake = (str) => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

export const snakeToCamel = (str) => {
  return str.replace(/([-_][a-z])/g, group =>
    group.toUpperCase().replace('-', '').replace('_', '')
  );
};

export const toCamelCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(v => toCamelCase(v));
  } else if (obj !== null && obj !== undefined && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      let camelKey = snakeToCamel(key);
      
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
  } else if (obj !== null && obj !== undefined && obj.constructor === Object) {
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
