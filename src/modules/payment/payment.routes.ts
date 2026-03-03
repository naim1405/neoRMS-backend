import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { verifyJwt } from '../../middlewares/auth.middleware';
import { UserRole } from '@prisma/client';
import { paymentValidation } from './payment.validation';
import { paymentController } from './payment.controller';

const router = express.Router();

// Customer initiates payment for an order
router.post(
    '/init',
    verifyJwt(UserRole.CUSTOMER),
    validateRequest(paymentValidation.initPaymentSchema),
    paymentController.initPayment,
);

// IPN callback from SSLCommerz (no auth — called by SSLCommerz server)
router.post('/ipn', paymentController.postIPN);

// SSLCommerz redirect callbacks (no auth — called by SSLCommerz after payment)
router.post('/success', paymentController.paymentSuccess);
router.post('/fail', paymentController.paymentFail);
router.post('/cancel', paymentController.paymentCancel);

export const paymentRoutes = router;