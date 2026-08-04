import AppError from '../../utils/app-error.js';
import { CODEX_TOKEN, compararSegredos } from '../../config/secrets.js';

/**
 * Porta do módulo Codex. Este módulo expõe, entre outras coisas, execução de SQL
 * arbitrário no banco de produção — então ele é fail-closed: sem CODEX_TOKEN
 * configurado no ambiente, as rotas respondem 404 como se não existissem.
 *
 * Antes havia um token padrão embutido no código ("codex_developer_secret_key_123456"),
 * publicado junto com o repositório: qualquer pessoa podia ler o banco inteiro e
 * criar um admin. Nunca mais existe valor padrão aqui.
 */
export const verifyCodexToken = (req, res, next) => {
  if (!CODEX_TOKEN) {
    return next(new AppError('Recurso não disponível.', 404, 'NOT_FOUND'));
  }

  const authHeader = req.headers.authorization;
  const headerToken = req.headers['x-codex-token'];

  let token = headerToken;
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // Comparação em tempo constante: um `!==` normal responde mais rápido quando o
  // primeiro caractere já difere, o que permite adivinhar o token byte a byte.
  if (!token || !compararSegredos(String(token), CODEX_TOKEN)) {
    return next(new AppError('Acesso não autorizado ao módulo Codex Agent.', 401, 'CODEX_UNAUTHORIZED'));
  }

  next();
};
