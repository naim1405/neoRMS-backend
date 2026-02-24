import express from 'express';
import { userController } from './user.controller';
import validateRequest from '../../middlewares/validateRequest';
import { userValidation } from './user.validation';
import { verifyJwt } from '../../middlewares/auth.middleware';
import { UserRole } from '@prisma/client';

const router = express.Router();

// ─── Public ───────────────────────────────────────────────────────────────────

// Anyone can sign up as CUSTOMER or OWNER
router.post(
    '/signup',
    validateRequest(userValidation.signupSchema),
    userController.signup,
);

// ─── Authenticated ────────────────────────────────────────────────────────────

// Get own profile
router.get(
    '/me',
    verifyJwt(),
    userController.getMyProfile,
);

// Update own profile
router.patch(
    '/me',
    verifyJwt(),
    validateRequest(userValidation.updateUserSchema),
    userController.updateMyProfile,
);

// Get all staff for a restaurant (OWNER or MANAGER)
router.get(
    '/restaurant/:restaurantId/staff',
    verifyJwt(UserRole.OWNER, UserRole.MANAGER),
    userController.getRestaurantStaff,
);

// ─── Staff creation ───────────────────────────────────────────────────────────

// OWNER creates MANAGER
router.post(
    '/staff/manager',
    verifyJwt(UserRole.OWNER),
    validateRequest(userValidation.createStaffSchema),
    userController.createManager,
);

// OWNER or MANAGER creates CHEF
router.post(
    '/staff/chef',
    verifyJwt(UserRole.OWNER, UserRole.MANAGER),
    validateRequest(userValidation.createStaffSchema),
    userController.createChef,
);

// OWNER or MANAGER creates WAITER
router.post(
    '/staff/waiter',
    verifyJwt(UserRole.OWNER, UserRole.MANAGER),
    validateRequest(userValidation.createStaffSchema),
    userController.createWaiter,
);

// ─── Delete ───────────────────────────────────────────────────────────────────

// OWNER can delete MANAGER; MANAGER can delete CHEF or WAITER
router.delete(
    '/:userId',
    verifyJwt(UserRole.OWNER, UserRole.MANAGER),
    userController.deleteUser,
);

export const userRoutes = router;
