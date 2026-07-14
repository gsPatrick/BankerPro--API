import { toSnakeCase } from './case-converter.js';

export const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data: toSnakeCase(data)
  });
};

export const sendCreated = (res, data, message = 'Resource created successfully') => {
  return sendSuccess(res, data, message, 201);
};

export const sendEmpty = (res, statusCode = 204) => {
  return res.status(statusCode).send();
};
