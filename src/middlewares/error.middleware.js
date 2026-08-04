import AppError from '../utils/app-error.js';

export default (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;
  error.code = err.code || 'INTERNAL_ERROR';

  // Log SEMPRE. Antes só logava fora de produção — ou seja, no dia em que
  // NODE_ENV virasse 'production' os erros inesperados sumiriam do log, que é
  // justamente quando eles importam.
  const inesperado = !err.isOperational && !err.statusCode;
  if (inesperado) {
    console.error('💥 Erro inesperado:', err);
  } else if (process.env.NODE_ENV !== 'production') {
    console.error('💥 Error: ', err);
  }

  // Handle Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    const message = err.errors.map(el => el.message).join('. ');
    error = new AppError(message, 400, 'VALIDATION_ERROR');
  }

  // Handle Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    const message = err.errors.map(el => `${el.path} already exists`).join('. ');
    error = new AppError(message, 409, 'DUPLICATE_ENTRY');
  }

  // Handle JWT verification errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token. Please log in again.', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Your token has expired. Please log in again.', 401, 'TOKEN_EXPIRED');
  }

  // Send response
  const statusCode = error.statusCode;

  // Mensagem genérica para o que não foi previsto. As falhas do próprio domínio
  // (AppError e os casos do Sequelize tratados acima) continuam explicando o que
  // houve; um erro cru, não. Ele carrega nome de tabela e coluna, caminho de
  // arquivo dentro do container e trecho de query — material de reconhecimento
  // para quem está mapeando o sistema. Ex.: 'column "users.password_hash" does
  // not exist at /app/node_modules/sequelize/...'.
  const mensagemPublica = error.isOperational || err.statusCode
    ? (error.message || 'Erro ao processar requisição.')
    : 'Não foi possível processar sua solicitação. Tente novamente.';

  return res.status(statusCode).json({
    success: false,
    error: {
      message: mensagemPublica,
      status: error.status || 'error',
      code: error.code,
      // O stack trace nunca sai na resposta HTTP por padrão. Antes ele saía
      // sempre que NODE_ENV != 'production' — e o servidor de produção roda com
      // NODE_ENV=development, então caminhos de arquivo, versões e trechos de
      // query iam para qualquer um que provocasse um erro. Para depurar,
      // EXPOSE_ERROR_STACK=true; o log do console continua completo do mesmo jeito.
      stack: process.env.EXPOSE_ERROR_STACK === 'true' ? err.stack : undefined
    }
  });
};
