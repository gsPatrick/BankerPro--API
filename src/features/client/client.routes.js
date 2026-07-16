import { Router } from 'express';
import * as clientController from './client.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { requirePermission } from '../../middlewares/permission.middleware.js';

const router = Router();

router.use(requireAuth);
// A Agenda é outra leitura da mesma base de clientes, então qualquer uma das
// duas funcionalidades libera este endpoint.
router.use(requirePermission('carteira', 'agenda'));

router.route('/')
  .get(clientController.getClients)
  .post(clientController.createClient);

router.route('/:id')
  .put(clientController.updateClient)
  .delete(clientController.deleteClient);

export default router;
