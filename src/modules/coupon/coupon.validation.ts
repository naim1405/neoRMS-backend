import { z } from 'zod';
import { CouponStatus, DiscountType } from '@prisma/client';

const createCouponSchema = z.object({
    body: z
        .object({
            code: z.string().min(1, 'Coupon code is required').toUpperCase(),
            description: z.string().optional(),
            discount: z.number().int().positive('Discount must be positive'),
            discountType: z.enum(DiscountType).optional(),
            validFrom: z.coerce.date(),
            validUntil: z.coerce.date(),
            usageLimit: z.number().int().positive().optional(),
            minOrderAmount: z.number().int().nonnegative().optional(),
            maxDiscount: z.number().int().positive().optional(),
            perUserLimit: z.number().int().positive().optional(),
            restaurantId: z.uuid().optional(),
        })
        .refine(data => new Date(data.validUntil) > new Date(data.validFrom), {
            message: 'validUntil must be after validFrom',
            path: ['validUntil'],
        }),
});

const updateCouponSchema = z.object({
    body: z.object({
        code: z.string().min(1).toUpperCase().optional(),
        description: z.string().optional(),
        discount: z.number().int().positive().optional(),
        discountType: z.enum(DiscountType).optional(),
        validFrom: z.coerce.date().optional(),
        validUntil: z.coerce.date().optional(),
        usageLimit: z.number().int().positive().optional(),
        minOrderAmount: z.number().int().nonnegative().optional(),
        maxDiscount: z.number().int().positive().optional(),
        perUserLimit: z.number().int().positive().optional(),
        status: z.enum(CouponStatus).optional(),
        restaurantId: z.uuid().optional(),
    }),
});

const validateCouponSchema = z.object({
    body: z.object({
        code: z.string().min(1, 'Coupon code is required'),
        orderAmount: z
            .number()
            .int()
            .nonnegative('Order amount must be non-negative'),
        restaurantId: z.uuid('Invalid restaurant ID'),
    }),
});

export const couponValidation = {
    createCouponSchema,
    updateCouponSchema,
    validateCouponSchema,
};
