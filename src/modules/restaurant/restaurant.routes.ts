import express from 'express';
import { restaurantController } from './restaurant.controller';
import { verifyJwt } from '../../middlewares/auth.middleware';
import validateRequest from '../../middlewares/validateRequest';
import { restaurantValidation } from './restaurant.validation';
import { UserRole } from '@prisma/client';
import { verifyTenantAccess } from '../../middlewares/tenant.middleware';

const router = express.Router();

// MANAGER & OWNER can create a restaurant
router.post(
    '/',
    verifyJwt(UserRole.OWNER),
    validateRequest(restaurantValidation.createRestaurantSchema),
    restaurantController.createRestaurant,
);

// MANAGER & OWNER can update a restaurant
router.patch(
    '/:id',
    verifyJwt(UserRole.MANAGER, UserRole.OWNER),
    verifyTenantAccess,
    validateRequest(restaurantValidation.updateRestaurantSchema),
    restaurantController.updateRestaurant,
);

router.get(
    '/my-restaurants',
    verifyJwt(),
    restaurantController.getRestaurantsByUserId,
);

// Public routes - no auth needed
router.get('/', restaurantController.getAllRestaurants);
router.get('/:id', restaurantController.getRestaurantById);

export const restaurantRoutes = router;
