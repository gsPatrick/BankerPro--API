import { Router } from 'express';
import * as noteController from './note.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/permission.middleware.js';
import { enforceLimit } from '../../middlewares/limit.middleware.js';

const router = Router();

router.use(requireAuth);
router.use(requirePermission('anotacoes'));

router.route('/')
  .get(noteController.getNotes)
  .post(enforceLimit('anotacoes'), noteController.createNote);

router.route('/:id')
  .delete(noteController.deleteNote);

export default router;
