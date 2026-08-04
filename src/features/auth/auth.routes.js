import { Router } from 'express';
import * as authController from './auth.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { authRateLimit, otpRequestRateLimit } from '../../middlewares/rate-limit.middleware.js';

const router = Router();

// Endpoints que disparam e-mail: teto por hora, para não virarem ferramenta de
// spam contra terceiros nem queimarem a cota do provedor.
router.post('/register', otpRequestRateLimit, authController.register);
router.post('/resend-otp', otpRequestRateLimit, authController.resendOtp);
router.post('/forgot-password', otpRequestRateLimit, authController.forgotPassword);

// Endpoints que conferem um segredo (senha ou OTP de 6 dígitos): teto por minuto
// contra força bruta.
router.post('/verify-otp', authRateLimit, authController.verifyOtp);
router.post('/login', authRateLimit, authController.login);
router.post('/reset-password', authRateLimit, authController.resetPassword);

router.get('/terms', authController.getTerms);

router.get('/me', requireAuth, authController.getMe);

export default router;
