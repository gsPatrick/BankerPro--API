import * as noteService from './note.service.js';
import catchAsync from '../../utils/catch-async.js';
import { sendSuccess, sendCreated, sendEmpty } from '../../utils/api-response.js';
import AppError from '../../utils/app-error.js';

export const getNotes = catchAsync(async (req, res, next) => {
  const notes = await noteService.listNotes(req.user.id);
  return sendSuccess(res, notes, 'Lista de anotações.');
});

export const createNote = catchAsync(async (req, res, next) => {
  const { content } = req.body;

  if (!content || content.trim() === '') {
    return next(new AppError('Conteúdo da anotação é obrigatório.', 400, 'BAD_REQUEST'));
  }

  const note = await noteService.createNote(req.user.id, { content });
  return sendCreated(res, note, 'Anotação criada.');
});

export const deleteNote = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  await noteService.deleteNote(req.user.id, id);
  return sendEmpty(res, 204);
});
