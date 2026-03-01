import express from 'express';
import { orderStatusController } from './orderStatus.controller';
import { verifyJwt } from '../../middlewares/auth.middleware';
import validateRequest from '../../middlewares/validateRequest';
import { orderStatusValidation } from './orderStatus.validation';
import { UserRole } from '@prisma/client';

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
    orderStatusController.getOrderStatsByUserID,
);

// Track order status in real-time
// GET /orders/track/:orderId
router.get(
    '/track/:orderId',
    verifyJwt(UserRole.CUSTOMER, UserRole.WAITER, UserRole.MANAGER),
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
    orderStatusController.updateOrderStatus,
);

// update order details
router.put(
    '/:orderId',
    verifyJwt(UserRole.CUSTOMER, UserRole.WAITER, UserRole.MANAGER),
    validateRequest(orderStatusValidation.updateOrderSchema),
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
    orderStatusController.deleteOrder,
);

// Hard delete order (admin/owner only)
// DELETE /orders/:orderId/hard
router.delete(
    '/:orderId/hard',
    verifyJwt(UserRole.MANAGER, UserRole.OWNER),
    validateRequest(orderStatusValidation.deleteOrderSchema), // reuse existing — just needs orderId param
    orderStatusController.hardDeleteOrder,
);

export const orderRoutes = router;
