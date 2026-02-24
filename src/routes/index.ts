import express from 'express';

const router = express.Router();
import { authRoutes } from '../modules/auth/auth.routes';
import { restaurantRoutes } from '../modules/restaurant/restaurant.routes';

const allRoutes = [
    {
        path: '/auth',
        route: authRoutes,
    },
    {
        path: '/restaurant',
        route: restaurantRoutes,
    },
];

allRoutes.forEach(route => {
    router.use(route.path, route.route);
});

export default router;
