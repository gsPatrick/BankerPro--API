import { Router } from 'express';
import * as clientController from './client.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.route('/')
  .get(clientController.getClients)
  .post(clientController.createClient);

router.route('/:id')
  .put(clientController.updateClient)
  .delete(clientController.deleteClient);

export default router;
