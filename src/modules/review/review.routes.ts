import express from 'express';
import { verifyJwt } from '../../middlewares/auth.middleware';
import validateRequest from '../../middlewares/validateRequest';
import { UserRole } from '@prisma/client';
import { verifyTenantAccess } from '../../middlewares/tenant.middleware';
import { reviewController } from './review.controller';
import { reviewValidation } from './review.validation';

const router = express.Router();

export const reviewRoutes = router;
