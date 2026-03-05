import express from 'express';
import { verifyJwt } from '../../middlewares/auth.middleware';
import validateRequest from '../../middlewares/validateRequest';
import { UserRole } from '@prisma/client';
import { verifyTenantAccess } from '../../middlewares/tenant.middleware';
import { reviewController } from './review.controller';
import { reviewValidation } from './review.validation';

const router = express.Router();

router.post(
	'/',
	verifyJwt(UserRole.CUSTOMER),
	verifyTenantAccess,
	validateRequest(reviewValidation.createReviewSchema),
	reviewController.createReview,
);

router.get(
	'/my',
	verifyJwt(UserRole.CUSTOMER),
	verifyTenantAccess,
	validateRequest(reviewValidation.getMyReviewsSchema),
	reviewController.getMyReviews,
);

router.get(
	'/my/order/:orderId',
	verifyJwt(UserRole.CUSTOMER),
	verifyTenantAccess,
	validateRequest(reviewValidation.getReviewByOrderSchema),
	reviewController.getMyReviewsByOrder,
);

router.get(
	'/my/menu-product/:menuProductId',
	verifyJwt(UserRole.CUSTOMER),
	verifyTenantAccess,
	validateRequest(reviewValidation.getReviewByMenuProductSchema),
	reviewController.getMyReviewsByMenuProduct,
);

router.get(
	'/management',
	verifyJwt(UserRole.OWNER, UserRole.MANAGER),
	verifyTenantAccess,
	validateRequest(reviewValidation.managementGetAllReviewsSchema),
	reviewController.managementGetAllReviews,
);

router.get(
	'/management/customer/:customerId',
	verifyJwt(UserRole.OWNER, UserRole.MANAGER),
	verifyTenantAccess,
	validateRequest(reviewValidation.managementGetByCustomerSchema),
	reviewController.managementGetReviewsByCustomer,
);

router.get(
	'/management/menu-product/:menuProductId',
	verifyJwt(UserRole.OWNER, UserRole.MANAGER),
	verifyTenantAccess,
	validateRequest(reviewValidation.managementGetByMenuProductSchema),
	reviewController.managementGetReviewsByMenuProduct,
);

router.get(
	'/management/order/:orderId',
	verifyJwt(UserRole.OWNER, UserRole.MANAGER),
	verifyTenantAccess,
	validateRequest(reviewValidation.managementGetByOrderSchema),
	reviewController.managementGetReviewsByOrder,
);

router.get(
	'/management/:reviewId',
	verifyJwt(UserRole.OWNER, UserRole.MANAGER),
	verifyTenantAccess,
	validateRequest(reviewValidation.managementGetSingleReviewSchema),
	reviewController.managementGetReviewById,
);

router.delete(
	'/management/:reviewId',
	verifyJwt(UserRole.OWNER, UserRole.MANAGER),
	verifyTenantAccess,
	validateRequest(reviewValidation.managementDeleteReviewSchema),
	reviewController.managementDeleteReview,
);

export const reviewRoutes = router;
