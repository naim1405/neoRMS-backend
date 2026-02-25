import express from 'express';
import { orderStatusController } from './orderStatus.controller';
import { verifyJwt } from '../../middlewares/auth.middleware';
import validateRequest from '../../middlewares/validateRequest';
import { orderStatusValidation } from './orderStatus.validation';

const router = express.Router();

// All routes require authentication
router.use(verifyJwt());

// Get all orders for the current user with optional filtering
// GET /api/customer/orders?limit=10&page=1&status=PENDING
router.get(
    '/',
    validateRequest(orderStatusValidation.getUserOrdersSchema),
    orderStatusController.getUserOrders,
);

// Get order statistics
// GET /api/customer/orders/stats
router.get('/stats', orderStatusController.getOrderStats);

// Track order status (real-time)
// GET /api/customer/orders/track/:orderId
router.get(
    '/track/:orderId',
    validateRequest(orderStatusValidation.trackOrderSchema),
    orderStatusController.trackOrder,
);

// Get order by ID
// GET /api/customer/orders/:orderId
router.get(
    '/:orderId',
    validateRequest(orderStatusValidation.getOrderByIdSchema),
    orderStatusController.getOrderById,
);

// delete order
// DELETE /api/customer/orders/:orderId
router.delete(
    '/:orderId',
    validateRequest(orderStatusValidation.deleteOrderSchema),
    orderStatusController.deleteOrder,
);


// update order
// PUT /api/customer/orders/:orderId
router.put(
    '/:orderId',
    validateRequest(orderStatusValidation.updateOrderSchema),
    orderStatusController.updateOrder,
);

export default router;
