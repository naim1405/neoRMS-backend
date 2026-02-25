import express from 'express';

const router = express.Router();

import { authRoutes } from '../modules/auth/auth.routes';
import { orderRoutes } from '../modules/order/orderStatus.routes';
import { restaurantRoutes } from '../modules/restaurant/restaurant.routes';
import { userRoutes } from '../modules/user/user.routes';


const allRoutes = [
    {
        path: '/auth',
        route: authRoutes,
    },
    {
        path: '/user',
        route: userRoutes,
    },
    {
        path: '/order',
        route: orderRoutes,
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
