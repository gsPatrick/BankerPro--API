import AppError from '../../utils/app-error.js';

export const verifyCodexToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const headerToken = req.headers['x-codex-token'];
  
  const configuredToken = process.env.CODEX_TOKEN || 'codex_developer_secret_key_123456';
  
  let token = headerToken;
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  
  if (!token || token !== configuredToken) {
    return next(new AppError('Acesso não autorizado ao módulo Codex Agent.', 401, 'CODEX_UNAUTHORIZED'));
  }
  
  next();
};
