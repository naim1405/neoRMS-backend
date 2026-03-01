import express from 'express';
import { orderStatusController } from './orderStatus.controller';
import { verifyJwt } from '../../middlewares/auth.middleware';
import validateRequest from '../../middlewares/validateRequest';
import { orderStatusValidation } from './orderStatus.validation';
import { UserRole } from '@prisma/client';
import { verifyTenantAccess } from '../../middlewares/tenant.middleware';

const router = express.Router();

// STATIC ROUTES (defined before dynamic routes with :id)

// Create a new order
// POST /orders
router.post(
    '/',
    verifyJwt(
        UserRole.CUSTOMER,
        UserRole.WAITER,
        UserRole.MANAGER,
        UserRole.OWNER,
    ),
    verifyTenantAccess,
    validateRequest(orderStatusValidation.createOrderSchema),
    orderStatusController.createOrder,
);

// Get order statistics by user ID
// GET /orders/stats/:userId
router.get(
    '/stats/:userId',
    verifyJwt(
        UserRole.CUSTOMER,
        UserRole.WAITER,
        UserRole.MANAGER,
        UserRole.OWNER,
    ),
    verifyTenantAccess,
    orderStatusController.getOrderStatsByUserID,
);

// Track order status in real-time
// GET /orders/track/:orderId
router.get(
    '/track/:orderId',
    verifyJwt(UserRole.CUSTOMER, UserRole.WAITER, UserRole.MANAGER),
    verifyTenantAccess,
    validateRequest(orderStatusValidation.trackOrderSchema),
    orderStatusController.trackOrder,
);

// Get single order by ID
// GET /orders/:orderId
router.get(
    '/:orderId',
    verifyJwt(
        UserRole.CUSTOMER,
        UserRole.WAITER,
        UserRole.MANAGER,
        UserRole.CHEF,
    ),
    validateRequest(orderStatusValidation.getOrderByIdSchema),
    verifyTenantAccess,
    orderStatusController.getOrderById,
);

// Get orders by status and order type
// GET /orders/status/:status?limit=10&page=1&orderType=DINE_IN
router.get(
    '/status/:status',
    verifyJwt(
        UserRole.CUSTOMER,
        UserRole.WAITER,
        UserRole.MANAGER,
        UserRole.CHEF,
    ),
    validateRequest(orderStatusValidation.getOrderByStatusAndOrderTypeSchema),
    verifyTenantAccess,
    orderStatusController.getOrderByStatusAndOrderType,
);

// Update order status
// PUT /orders/:orderId/status
router.put(
    '/:orderId/status',
    verifyJwt(
        UserRole.CUSTOMER,
        UserRole.WAITER,
        UserRole.MANAGER,
        UserRole.CHEF,
    ),
    validateRequest(orderStatusValidation.updateOrderStatusSchema),
    verifyTenantAccess,
    orderStatusController.updateOrderStatus,
);

// update order details
router.put(
    '/:orderId',
    verifyJwt(UserRole.CUSTOMER, UserRole.WAITER, UserRole.MANAGER),
    validateRequest(orderStatusValidation.updateOrderSchema),
    verifyTenantAccess,
    orderStatusController.updateOrder,
);

// Delete order (soft delete - update is deleted flag)
// DELETE /orders/:orderId
router.patch(
    '/:orderId/delete/soft',
    verifyJwt(
        UserRole.CUSTOMER,
        UserRole.WAITER,
        UserRole.MANAGER,
        UserRole.OWNER,
    ),
    validateRequest(orderStatusValidation.deleteOrderSchema),
    verifyTenantAccess,
    orderStatusController.deleteOrder,
);

// Hard delete order (admin/owner only)
// DELETE /orders/:orderId/hard
router.delete(
    '/:orderId/hard',
    verifyJwt(UserRole.MANAGER, UserRole.OWNER),
    validateRequest(orderStatusValidation.deleteOrderSchema), // reuse existing — just needs orderId param
    verifyTenantAccess,
    orderStatusController.hardDeleteOrder,
);

export const orderRoutes = router;
