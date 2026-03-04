import express from 'express';
import { couponController } from './coupon.controller';
import { verifyJwt } from '../../middlewares/auth.middleware';
import validateRequest from '../../middlewares/validateRequest';
import { couponValidation } from './coupon.validation';
import { UserRole } from '@prisma/client';
import { verifyTenantAccess } from '../../middlewares/tenant.middleware';

const router = express.Router();

// Customer: validate a coupon (check if it's valid and get the benefit)
router.post(
    '/validate',
    verifyJwt(UserRole.CUSTOMER),
    validateRequest(couponValidation.validateCouponSchema),
    couponController.validateCoupon,
);

// Owner & Manager: create a coupon for a restaurant (tenant-scoped)
router.post(
    '/:restaurantId',
    verifyJwt(UserRole.OWNER, UserRole.MANAGER),
    verifyTenantAccess,
    validateRequest(couponValidation.createCouponSchema),
    couponController.createCoupon,
);

// Owner & Manager: get all coupons for a restaurant
router.get(
    '/:restaurantId',
    verifyJwt(UserRole.OWNER, UserRole.MANAGER),
    verifyTenantAccess,
    couponController.getAllCouponsByRestaurant,
);

// Owner & Manager: get a single coupon
router.get(
    '/:restaurantId/:couponId',
    verifyJwt(UserRole.OWNER, UserRole.MANAGER),
    verifyTenantAccess,
    couponController.getCouponById,
);

// Owner & Manager: update a coupon
router.patch(
    '/:restaurantId/:couponId',
    verifyJwt(UserRole.OWNER, UserRole.MANAGER),
    verifyTenantAccess,
    validateRequest(couponValidation.updateCouponSchema),
    couponController.updateCoupon,
);

// Owner & Manager: delete (soft-delete) a coupon
router.delete(
    '/:restaurantId/:couponId',
    verifyJwt(UserRole.OWNER, UserRole.MANAGER),
    verifyTenantAccess,
    couponController.deleteCoupon,
);

export const couponRoutes = router;
