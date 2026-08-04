import AppError from './app-error.js';

/**
 * Freio das duas ferramentas que executam SQL cru: o módulo Codex e o agente de
 * IA do painel admin.
 *
 * Mesmo com token forte e restrição a admin, uma única instrução errada apaga a
 * base inteira — e no caso do agente quem escreve o SQL é um modelo de
 * linguagem, que pode ser induzido por texto que o próprio usuário cadastrou
 * (um cliente chamado "'; DROP TABLE users; --", por exemplo).
 *
 * Por padrão só passa consulta de leitura. Escrita exige ligar SQL_ALLOW_WRITE
 * no ambiente, de forma consciente e temporária.
 */

const PERMITE_ESCRITA = String(process.env.SQL_ALLOW_WRITE || '').toLowerCase() === 'true';

// Comandos que alteram ou destroem dados/estrutura.
const COMANDOS_DE_ESCRITA = /^(insert|update|delete|drop|truncate|alter|create|grant|revoke|replace|merge|comment|rename)\b/i;

// Sempre proibido, mesmo com escrita liberada: são os que apagam tudo de uma vez
// ou dão acesso permanente.
const SEMPRE_BLOQUEADO = /^(drop\s+(database|schema)|truncate\s+.*\busers\b|grant|revoke)\b/i;

/**
 * Remove comentários para que "/*x*​/ DROP" ou "-- \nDROP" não escapem da checagem,
 * e normaliza espaços.
 */
const normalizar = (sql) =>
  String(sql)
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\n]*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Valida o SQL recebido. Lança AppError quando não pode rodar; devolve o comando
 * normalizado quando pode.
 */
export const validarSql = (sqlOriginal) => {
  const sql = normalizar(sqlOriginal);

  if (!sql) {
    throw new AppError('Comando SQL vazio.', 400, 'SQL_EMPTY');
  }

  // Uma instrução por chamada: com várias, a primeira parece inofensiva e a
  // segunda faz o estrago ("SELECT 1; DROP TABLE users").
  const semPontoFinal = sql.replace(/;\s*$/, '');
  if (semPontoFinal.includes(';')) {
    throw new AppError(
      'Envie um comando SQL por vez. Múltiplas instruções na mesma chamada não são aceitas.',
      400,
      'SQL_MULTIPLE_STATEMENTS'
    );
  }

  if (SEMPRE_BLOQUEADO.test(semPontoFinal)) {
    throw new AppError(
      'Este comando não é permitido por aqui (remoção de banco/esquema ou alteração de permissões).',
      403,
      'SQL_FORBIDDEN'
    );
  }

  if (COMANDOS_DE_ESCRITA.test(semPontoFinal) && !PERMITE_ESCRITA) {
    throw new AppError(
      'Somente consultas de leitura são permitidas. Para executar escrita, ligue SQL_ALLOW_WRITE=true no ambiente temporariamente.',
      403,
      'SQL_READ_ONLY'
    );
  }

  return semPontoFinal;
};

export const escritaSqlLiberada = () => PERMITE_ESCRITA;
