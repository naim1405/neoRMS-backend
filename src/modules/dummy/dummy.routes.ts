import express from 'express';
import { dummyController } from './dummy.controller';

const router = express.Router();

router.post('/place-order', dummyController.customerPlaceOrder);

router.post('/cancel-order', dummyController.customerCancelOrder);

router.post('/cancelled-by-chef', dummyController.chefCancelOrder);

router.post('/order-ready', dummyController.chefOrderReady);

router.post('/order-confirmed', dummyController.waiterConfirmOrder);

router.post('/order-accepted', dummyController.chefAcceptOrder);

router.post('/ai-sync', dummyController.syncAiDate);

export const dummyRoutes = router;
