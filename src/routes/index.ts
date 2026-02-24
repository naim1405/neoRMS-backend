import express from 'express';

const router = express.Router();
import { authRoutes } from '../modules/auth/auth.routes';

const allRoutes = [
    {
        path: '/auth',
        route: authRoutes,
    },
];

allRoutes.forEach(route => {
    router.use(route.path, route.route);
});

export default router;
