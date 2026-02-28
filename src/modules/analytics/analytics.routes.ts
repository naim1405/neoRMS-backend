import express from 'express';
import { UserRole } from '@prisma/client';
import { verifyJwt } from '../../middlewares/auth.middleware';
import validateRequest from '../../middlewares/validateRequest';
import { analyticsController } from './analytics.controller';
import { analyticsValidation } from './analytics.validation';
import { verifyTenantAccess } from '../../middlewares/tenant.middleware';
//TODO: Add tenant access verification to all relevent routes once implemented

const router = express.Router();

const managerAndAbove = [UserRole.OWNER, UserRole.MANAGER];
const ownerOnly = [UserRole.OWNER];

// GET /analytics
// Summary view — available to managers and owners; accepts optional ?restaurantId query param
router.get(
    '/',
    verifyJwt(...managerAndAbove),
    validateRequest(analyticsValidation.summarySchema),
    analyticsController.getSummary,
);

// GET /analytics/dashboard/:restaurantId
router.get(
    '/dashboard/:restaurantId',
    verifyJwt(...managerAndAbove),
    validateRequest(analyticsValidation.dashboardSchema),
    analyticsController.getDashboard,
);

// GET /analytics/orders/:restaurantId
router.get(
    '/orders/:restaurantId',
    verifyJwt(...managerAndAbove),
    validateRequest(analyticsValidation.ordersSchema),
    analyticsController.getOrders,
);

// GET /analytics/menu/:restaurantId
router.get(
    '/menu/:restaurantId',
    verifyJwt(...managerAndAbove),
    validateRequest(analyticsValidation.menuSchema),
    analyticsController.getMenu,
);

// GET /analytics/inventory/:restaurantId
router.get(
    '/inventory/:restaurantId',
    verifyJwt(...managerAndAbove),
    validateRequest(analyticsValidation.inventorySchema),
    analyticsController.getInventory,
);

// GET /analytics/restaurants
// Owner-only — returns cross-restaurant aggregated analytics
router.get(
    '/restaurants',
    verifyJwt(...ownerOnly),
    validateRequest(analyticsValidation.restaurantsSchema),
    analyticsController.getRestaurants,
);

export const analyticsRoutes = router;
