import express from 'express';

const router = express.Router();
import { authRoutes } from '../modules/auth/auth.routes';
import { restaurantRoutes } from '../modules/restaurant/restaurant.routes';
import { userRoutes } from '../modules/user/user.routes';

const allRoutes = [
    {
        path: '/auth',
        route: authRoutes,
    },
    {
        path: '/restaurant',
        route: restaurantRoutes,
    },
    {
        path: '/user',
        route: userRoutes,
    },
];

allRoutes.forEach(route => {
    router.use(route.path, route.route);
});

export default router;
