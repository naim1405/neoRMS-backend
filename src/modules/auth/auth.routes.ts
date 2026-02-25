import express from 'express';
import { authController } from './auth.controller';
import { verifyJwt } from '../../middlewares/auth.middleware';
import passport from 'passport';
import validateRequest from '../../middlewares/validateRequest';
import { authValidation } from './auth.validation';

const router = express.Router();

router.post(
    '/login',
    validateRequest(authValidation.loginSchema),
    authController.loginUser,
);

router.post('/refresh-token', authController.refreshAccessToken);

router.post(
    '/verify-email',
    validateRequest(authValidation.emailVerificationSchema),
    authController.verifyEmail,
);

router.get('/logout', verifyJwt(), authController.logoutUser);

router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }),
);

router.get(
    '/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/login',
    }),
    authController.googleAuthSuccess,
);

export const authRoutes = router;
