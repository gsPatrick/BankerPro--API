import AppError from '../utils/app-error.js';

export default (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;
  error.code = err.code || 'INTERNAL_ERROR';

  // Log detailed error in development
  if (process.env.NODE_ENV !== 'production') {
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
  return res.status(statusCode).json({
    success: false,
    error: {
      message: error.message || 'Internal Server Error',
      status: error.status || 'error',
      code: error.code,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    }
  });
};
