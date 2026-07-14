import { Note } from '../../models/index.js';
import AppError from '../../utils/app-error.js';

export const listNotes = async (userId) => {
  const notes = await Note.findAll({
    where: { createdByUserId: userId },
    order: [['created_at', 'DESC']]
  });
  return notes;
};

export const createNote = async (userId, data) => {
  const note = await Note.create({
    createdByUserId: userId,
    content: data.content
  });
  return note;
};

export const deleteNote = async (userId, noteId) => {
  const note = await Note.findOne({
    where: { id: noteId, createdByUserId: userId }
  });

  if (!note) {
    throw new AppError('Anotação não encontrada ou não pertence a você.', 404, 'NOTE_NOT_FOUND');
  }

  await note.destroy();
  return { success: true };
};
