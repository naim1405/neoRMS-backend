import httpstatus from 'http-status';
import prisma from '../../utils/prisma';
import ApiError from '../../utils/ApiError';
import { JwtPayload } from '../../types/jwt.types';
import { ICreateCoupon, IUpdateCoupon, IValidateCoupon } from './coupon.types';
import { CouponStatus } from '@prisma/client';

const createCoupon = async (
    payload: ICreateCoupon,
    user: JwtPayload,
    tenantId: string,
) => {
    // Verify tenantId belongs to this user (owner/manager) - tenant middleware already checked this
    const existingCode = await prisma.coupon.findUnique({
        where: { code: payload.code.toUpperCase() },
    });
    if (existingCode) {
        throw new ApiError(httpstatus.CONFLICT, 'Coupon code already exists');
    }

    if (payload.restaurantId) {
        const restaurant = await prisma.restaurant.findFirst({
            where: { id: payload.restaurantId, tenantId },
        });
        if (!restaurant) {
            throw new ApiError(
                httpstatus.NOT_FOUND,
                'Restaurant not found for this tenant',
            );
        }
    }

    const coupon = await prisma.coupon.create({
        data: {
            code: payload.code.toUpperCase(),
            description: payload.description,
            discount: payload.discount,
            discountType: payload.discountType,
            validFrom: new Date(payload.validFrom),
            validUntil: new Date(payload.validUntil),
            usageLimit: payload.usageLimit,
            minOrderAmount: payload.minOrderAmount,
            maxDiscount: payload.maxDiscount,
            perUserLimit: payload.perUserLimit,
            tenantId,
            restaurantId: payload.restaurantId,
        },
    });

    return coupon;
};

const getAllCouponsByRestaurant = async (
    restaurantId: string,
    tenantId: string,
) => {
    const restaurant = await prisma.restaurant.findFirst({
        where: { id: restaurantId, tenantId, isDeleted: false },
    });
    if (!restaurant) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Restaurant not found');
    }

    const coupons = await prisma.coupon.findMany({
        where: {
            tenantId,
            restaurantId,
            isDeleted: false,
        },
        orderBy: { createdAt: 'desc' },
    });

    return coupons;
};

const getCouponById = async (
    couponId: string,
    restaurantId: string,
    tenantId: string,
) => {
    const coupon = await prisma.coupon.findFirst({
        where: {
            id: couponId,
            restaurantId,
            tenantId,
            isDeleted: false,
        },
    });
    if (!coupon) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Coupon not found');
    }
    return coupon;
};

const updateCoupon = async (
    couponId: string,
    restaurantId: string,
    tenantId: string,
    payload: IUpdateCoupon,
) => {
    const coupon = await prisma.coupon.findFirst({
        where: { id: couponId, restaurantId, tenantId, isDeleted: false },
    });
    if (!coupon) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Coupon not found');
    }

    if (payload.code && payload.code.toUpperCase() !== coupon.code) {
        const existingCode = await prisma.coupon.findUnique({
            where: { code: payload.code.toUpperCase() },
        });
        if (existingCode) {
            throw new ApiError(
                httpstatus.CONFLICT,
                'Coupon code already exists',
            );
        }
    }

    const updated = await prisma.coupon.update({
        where: { id: couponId },
        data: {
            ...payload,
            code: payload.code ? payload.code.toUpperCase() : undefined,
            validFrom: payload.validFrom
                ? new Date(payload.validFrom)
                : undefined,
            validUntil: payload.validUntil
                ? new Date(payload.validUntil)
                : undefined,
        },
    });

    return updated;
};

const deleteCoupon = async (
    couponId: string,
    restaurantId: string,
    tenantId: string,
    userId: string,
) => {
    const coupon = await prisma.coupon.findFirst({
        where: { id: couponId, restaurantId, tenantId, isDeleted: false },
    });
    if (!coupon) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Coupon not found');
    }

    await prisma.coupon.update({
        where: { id: couponId },
        data: { isDeleted: true, deletedBy: userId },
    });

    return null;
};

const validateCoupon = async (payload: IValidateCoupon, customerId: string) => {
    const now = new Date();

    const coupon = await prisma.coupon.findFirst({
        where: {
            code: payload.code.toUpperCase(),
            isDeleted: false,
            restaurantId: payload.restaurantId,
        },
    });

    if (!coupon) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Invalid coupon code');
    }

    // Check status
    if (coupon.status !== CouponStatus.ACTIVE) {
        throw new ApiError(
            httpstatus.BAD_REQUEST,
            `Coupon is ${coupon.status.toLowerCase()}`,
        );
    }

    // Check validity window
    if (now < coupon.validFrom) {
        throw new ApiError(httpstatus.BAD_REQUEST, 'Coupon is not yet active');
    }
    if (now > coupon.validUntil) {
        throw new ApiError(httpstatus.BAD_REQUEST, 'Coupon has expired');
    }

    // Check global usage limit
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        throw new ApiError(
            httpstatus.BAD_REQUEST,
            'Coupon usage limit has been reached',
        );
    }

    // Check minimum order amount
    if (
        coupon.minOrderAmount !== null &&
        payload.orderAmount < coupon.minOrderAmount
    ) {
        throw new ApiError(
            httpstatus.BAD_REQUEST,
            `Minimum order amount of ${coupon.minOrderAmount} is required to use this coupon`,
        );
    }

    // Check per-user usage limit
    if (coupon.perUserLimit !== null) {
        const userUsageCount = await prisma.couponUsage.count({
            where: { couponId: coupon.id, customerId },
        });
        if (userUsageCount >= coupon.perUserLimit) {
            throw new ApiError(
                httpstatus.BAD_REQUEST,
                'You have reached the usage limit for this coupon',
            );
        }
    }

    // Calculate discount
    let discountAmount: number;
    if (coupon.discountType === 'PERCENTAGE') {
        discountAmount = (payload.orderAmount * coupon.discount) / 100;
        if (coupon.maxDiscount !== null) {
            discountAmount = Math.min(discountAmount, coupon.maxDiscount);
        }
    } else {
        discountAmount = coupon.discount;
    }

    const finalAmount = Math.max(0, payload.orderAmount - discountAmount);

    return {
        coupon: {
            id: coupon.id,
            code: coupon.code,
            description: coupon.description,
            discount: coupon.discount,
            discountType: coupon.discountType,
            validFrom: coupon.validFrom,
            validUntil: coupon.validUntil,
            minOrderAmount: coupon.minOrderAmount,
            maxDiscount: coupon.maxDiscount,
        },
        benefit: {
            originalAmount: payload.orderAmount,
            discountAmount: parseFloat(discountAmount.toFixed(2)),
            finalAmount: parseFloat(finalAmount.toFixed(2)),
        },
    };
};

export const couponService = {
    createCoupon,
    getAllCouponsByRestaurant,
    getCouponById,
    updateCoupon,
    deleteCoupon,
    validateCoupon,
};
