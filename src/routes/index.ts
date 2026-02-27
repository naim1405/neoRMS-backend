import express from 'express';

const router = express.Router();

import { authRoutes } from '../modules/auth/auth.routes';
import { inventoryRoutes } from '../modules/inventory/inventory.routes';
import { menuProductRoutes } from '../modules/menuProduct/menuProduct.routes';
import { orderRoutes } from '../modules/order/orderStatus.routes';
import { restaurantRoutes } from '../modules/restaurant/restaurant.routes';
import { userRoutes } from '../modules/user/user.routes';
import { dummyRoutes } from '../modules/dummy/dummy.routes';

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
    {
        path: '/menuProduct',
        route: menuProductRoutes,
    },
    {      
        path: '/inventory',
        route: inventoryRoutes,
    },
    {
        path: '/dummy',
        route: dummyRoutes,
    },
];

allRoutes.forEach(route => {
    router.use(route.path, route.route);
});

export default router;
