import { Router } from 'express';
import * as profileController from './user-profile.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', profileController.getProfile);
router.post('/', profileController.createProfile);
router.put('/', profileController.updateProfile);
router.put('/:id', profileController.updateProfile);

export default router;
