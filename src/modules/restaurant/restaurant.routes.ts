import express from 'express';
import { restaurantController } from './restaurant.controller';
import { verifyJwt } from '../../middlewares/auth.middleware';
import validateRequest from '../../middlewares/validateRequest';
import { restaurantValidation } from './restaurant.validation';
import { UserRole } from '@prisma/client';

const router = express.Router();

// MANAGER & OWNER can create a restaurant
router.post(
    '/',
    verifyJwt(UserRole.MANAGER, UserRole.OWNER),
    validateRequest(restaurantValidation.createRestaurantSchema),
    restaurantController.createRestaurant,
);

// MANAGER & OWNER can update a restaurant
router.patch(
    '/:id',
    verifyJwt(UserRole.MANAGER, UserRole.OWNER),
    validateRequest(restaurantValidation.updateRestaurantSchema),
    restaurantController.updateRestaurant,
);

// Public routes - no auth needed
router.get('/user/:userId', restaurantController.getRestaurantsByUserId);
router.get('/', restaurantController.getAllRestaurants);
router.get('/:id', restaurantController.getRestaurantById);

export const restaurantRoutes = router;
