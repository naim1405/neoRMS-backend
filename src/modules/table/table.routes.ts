import express from 'express';
import { tableController } from './table.controller';
import { verifyJwt } from '../../middlewares/auth.middleware';
import validateRequest from '../../middlewares/validateRequest';
import { tableValidator } from './table.validator';
import { UserRole } from '@prisma/client';
import { verifyTenantAccess } from '../../middlewares/tenant.middleware';

const router = express.Router();

// GET /table/:restaurantId - Get all tables for a restaurant (no auth check)
router.get(
    '/:restaurantId',
    validateRequest(tableValidator.getTablesSchema),
    tableController.getTablesByRestaurantID,
);

// POST /table/:restaurantId - Create a table (OWNER, MANAGER)
router.post(
    '/:restaurantId',
    verifyJwt(UserRole.OWNER, UserRole.MANAGER),
    verifyTenantAccess,
    validateRequest(tableValidator.createTableSchema),
    tableController.createTable,
);

// PATCH /table/:restaurantId/:tableId - Update table details (OWNER, MANAGER)
router.patch(
    '/:restaurantId/:tableId',
    verifyJwt(UserRole.OWNER, UserRole.MANAGER),
    verifyTenantAccess,
    validateRequest(tableValidator.updateTableSchema),
    tableController.updateTable,
);

// DELETE /table/:restaurantId/:tableId - Delete a table (OWNER, MANAGER)
router.delete(
    '/:restaurantId/:tableId',
    verifyJwt(UserRole.OWNER, UserRole.MANAGER),
    verifyTenantAccess,
    validateRequest(tableValidator.deleteTableSchema),
    tableController.softDeleteTable,
);

// Hard delete table (Manager and Owner only)
router.delete(
    '/:restaurantId/:tableId/hard',
    verifyJwt(UserRole.OWNER, UserRole.MANAGER),
    verifyTenantAccess,
    validateRequest(tableValidator.deleteTableSchema),
    tableController.hardDeleteTable,
);

// POST /table/reserve/:tableId - Create reservation (CUSTOMER, WAITER)
router.post(
    '/reserve/:tableId',
    verifyJwt(UserRole.CUSTOMER, UserRole.WAITER, UserRole.MANAGER),
    verifyTenantAccess,
    validateRequest(tableValidator.createReservationSchema),
    tableController.createReservation,
);

// PATCH /table/reserve/:reservationId - Update reservation status (CUSTOMER, WAITER)
router.patch(
    '/reserve/:reservationId',
    verifyJwt(UserRole.CUSTOMER, UserRole.WAITER, UserRole.MANAGER),
    verifyTenantAccess,
    validateRequest(tableValidator.updateReservationDetailsSchema),
    tableController.updateReservationDetails,
);

// DYNAMIC ROUTES

export const tableRoutes = router;
