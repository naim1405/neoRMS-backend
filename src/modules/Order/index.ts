import express from 'express';
import menuRoutes from './menu/menu.routes';
import orderStatusRoutes from './orderStatus/orderStatus.routes';

const router = express.Router();

// Menu endpoints
// Routes: GET /api/customer/menu
router.use('/menu', menuRoutes);

// Order status endpoints
// Routes: GET /api/customer/orders
router.use('/orders', orderStatusRoutes);

export default router;
