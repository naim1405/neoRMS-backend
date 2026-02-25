import express from 'express';
import { UserRole } from '@prisma/client';
import { verifyJwt } from '../../middlewares/auth.middleware';
import validateRequest from '../../middlewares/validateRequest';
import { menuProductController } from './menuProduct.controller';
import { menuProductValidation } from './menuProduct.validation';

const router = express.Router({ mergeParams: true });

// Public routes - no auth required
router.get('/:restaurantId', menuProductController.getMenuProductsByRestaurant);
router.get('/:restaurantId/:menuProductId', menuProductController.getMenuProductById);

// Protected routes - MANAGER or OWNER only
router.post(
    '/:restaurantId',
    verifyJwt(UserRole.MANAGER, UserRole.OWNER),
    validateRequest(menuProductValidation.createMenuProductSchema),
    menuProductController.createMenuProduct,
);

router.patch(
    '/:restaurantId/:menuProductId',
    verifyJwt(UserRole.MANAGER, UserRole.OWNER),
    validateRequest(menuProductValidation.updateMenuProductSchema),
    menuProductController.updateMenuProduct,
);

router.delete(
    '/:restaurantId/:menuProductId',
    verifyJwt(UserRole.MANAGER, UserRole.OWNER),
    menuProductController.deleteMenuProduct,
);

export const menuProductRoutes = router;
