import httpstatus from 'http-status';
import sendResponse from '../../utils/ApiResponse';
import catchAsync from '../../utils/catchAsync';
import { couponService } from './coupon.service';
import { JwtPayload } from '../../types/jwt.types';

const createCoupon = catchAsync(async (req: any, res) => {
    const result = await couponService.createCoupon(
        { ...req.body, restaurantId: req.params.restaurantId },
        req.user as JwtPayload,
        req.tenantId as string,
    );
    sendResponse(res, {
        statusCode: httpstatus.CREATED,
        success: true,
        message: 'Coupon created successfully',
        data: result,
    });
});

const getAllCouponsByRestaurant = catchAsync(async (req: any, res) => {
    const result = await couponService.getAllCouponsByRestaurant(
        req.params.restaurantId,
        req.tenantId as string,
    );
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Coupons fetched successfully',
        data: result,
    });
});

const getCouponById = catchAsync(async (req: any, res) => {
    const result = await couponService.getCouponById(
        req.params.couponId,
        req.params.restaurantId,
        req.tenantId as string,
    );
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Coupon fetched successfully',
        data: result,
    });
});

const updateCoupon = catchAsync(async (req: any, res) => {
    const result = await couponService.updateCoupon(
        req.params.couponId,
        req.params.restaurantId,
        req.tenantId as string,
        req.body,
    );
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Coupon updated successfully',
        data: result,
    });
});

const deleteCoupon = catchAsync(async (req: any, res) => {
    await couponService.deleteCoupon(
        req.params.couponId,
        req.params.restaurantId,
        req.tenantId as string,
        (req.user as JwtPayload).id,
    );
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Coupon deleted successfully',
        data: null,
    });
});

const validateCoupon = catchAsync(async (req: any, res) => {
    const result = await couponService.validateCoupon(
        req.body,
        (req.user as JwtPayload).id,
    );
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Coupon is valid',
        data: result,
    });
});

export const couponController = {
    createCoupon,
    getAllCouponsByRestaurant,
    getCouponById,
    updateCoupon,
    deleteCoupon,
    validateCoupon,
};
