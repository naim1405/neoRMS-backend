import { CouponStatus, DiscountType } from '@prisma/client';

export interface ICreateCoupon {
    code: string;
    description?: string;
    discount: number;
    discountType?: DiscountType;
    validFrom: string | Date;
    validUntil: string | Date;
    usageLimit?: number;
    minOrderAmount?: number;
    maxDiscount?: number;
    perUserLimit?: number;
    restaurantId?: string;
}

export interface IUpdateCoupon {
    code?: string;
    description?: string;
    discount?: number;
    discountType?: DiscountType;
    validFrom?: string | Date;
    validUntil?: string | Date;
    usageLimit?: number;
    minOrderAmount?: number;
    maxDiscount?: number;
    perUserLimit?: number;
    status?: CouponStatus;
    restaurantId?: string;
}

export interface IValidateCoupon {
    code: string;
    orderAmount: number;
    restaurantId: string;
}
