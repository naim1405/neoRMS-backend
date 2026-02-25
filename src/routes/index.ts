import express from 'express';

const router = express.Router();
import { authRoutes } from '../modules/auth/auth.routes';
import { orderRoutes } from '../modules/Order/orderStatus.routes';

const allRoutes = [
    {
        path: '/auth',
        route: authRoutes,
    },
    {
        path: '/order',
        route: orderRoutes,
    },
];

allRoutes.forEach(route => {
    router.use(route.path, route.route);
});

export default router;
