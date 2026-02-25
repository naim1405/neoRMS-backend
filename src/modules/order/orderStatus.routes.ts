import express from 'express';
import { orderStatusController } from './orderStatus.controller';
import { verifyJwt } from '../../middlewares/auth.middleware';
import validateRequest from '../../middlewares/validateRequest';
import { orderStatusValidation } from './orderStatus.validation';

const router = express.Router();

// STATIC ROUTES (defined before dynamic routes with :id)

// Create a new order
// POST /orders
router.post(
    '/',
    verifyJwt(),
    validateRequest(orderStatusValidation.createOrderSchema),
    orderStatusController.createOrder,
);

// Get order statistics
// GET /orders/stats
router.get(
    '/stats',
    verifyJwt(),
    orderStatusController.getOrderStats,
);

// Get orders by status
// GET /orders/status/:status?limit=10&page=1
router.get(
    '/status/:status',
    verifyJwt(),
    validateRequest(orderStatusValidation.getOrderByStatusSchema),
    orderStatusController.getOrderByStatus,
);

// Track order status in real-time
// GET /orders/track/:orderId
router.get(
    '/track/:orderId',
    verifyJwt(),
    validateRequest(orderStatusValidation.trackOrderSchema),
    orderStatusController.trackOrder,
);

// DYNAMIC ROUTES

// Get all orders for the current user with optional filtering
// GET /orders?limit=10&page=1&status=PENDING
router.get(
    '/',
    verifyJwt(),
    validateRequest(orderStatusValidation.getUserOrdersSchema),
    orderStatusController.getUserOrders,
);

// Get single order by ID
// GET /orders/:orderId
router.get(
    '/:orderId',
    verifyJwt(),
    validateRequest(orderStatusValidation.getOrderByIdSchema),
    orderStatusController.getOrderById,
);

// Update order
// PUT /orders/:orderId
router.put(
    '/:orderId',
    verifyJwt(),
    validateRequest(orderStatusValidation.updateOrderSchema),
    orderStatusController.updateOrder,
);

// Delete order
// DELETE /orders/:orderId
router.delete(
    '/:orderId',
    verifyJwt(),
    validateRequest(orderStatusValidation.deleteOrderSchema),
    orderStatusController.deleteOrder,
);

export const orderRoutes = router;
