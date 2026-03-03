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

// Get order history for the requesting user
// GET /orders?status=PENDING&orderType=DINE_IN&limit=10&page=1
router.get(
    '/customer-orders',
    verifyJwt(UserRole.CUSTOMER),
    verifyTenantAccess,
    validateRequest(orderStatusValidation.getUserOrdersSchema),
    orderStatusController.getUserOrders,
);

router.get(
    '/restaurant-orders/:restaurantId',
    verifyJwt(UserRole.OWNER, UserRole.MANAGER, UserRole.WAITER, UserRole.CHEF),
    verifyTenantAccess,
    validateRequest(orderStatusValidation.getRestaurantOrdersSchema),
    orderStatusController.getRestaurantOrders,
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
    verifyJwt(
        UserRole.CUSTOMER,
        UserRole.WAITER,
        UserRole.MANAGER,
        UserRole.CHEF,
        UserRole.OWNER,
    ),
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
        UserRole.OWNER,
    ),
    verifyTenantAccess,
    validateRequest(orderStatusValidation.getOrderByIdSchema),
    orderStatusController.getOrderById,
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
    verifyTenantAccess,
    validateRequest(orderStatusValidation.updateOrderStatusSchema),
    orderStatusController.updateOrderStatus,
);

// update order details
router.put(
    '/:orderId',
    verifyJwt(UserRole.CUSTOMER, UserRole.WAITER, UserRole.MANAGER),
    verifyTenantAccess,
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
    verifyTenantAccess,
    validateRequest(orderStatusValidation.deleteOrderSchema),
    orderStatusController.deleteOrder,
);

// Hard delete order (admin/owner only)
// DELETE /orders/:orderId/hard
router.delete(
    '/:orderId/hard',
    verifyJwt(UserRole.MANAGER, UserRole.OWNER),
    verifyTenantAccess,
    validateRequest(orderStatusValidation.deleteOrderSchema), // reuse existing — just needs orderId param
    orderStatusController.hardDeleteOrder,
);

export const orderRoutes = router;
