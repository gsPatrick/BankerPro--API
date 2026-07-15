import AppError from '../../utils/app-error.js';
import { sendSuccess } from '../../utils/api-response.js';

export const uploadFile = (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Nenhum arquivo enviado.', 400, 'BAD_REQUEST'));
  }

  // Multer saves the file. We return the relative URL
  const fileUrl = `/uploads/${req.file.filename}`;
  return sendSuccess(res, { url: fileUrl }, 'Arquivo enviado com sucesso.');
};
