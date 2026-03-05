import ApiError from '../../utils/ApiError';
import httpstatus from 'http-status';
import prisma from '../../utils/prisma';
import { JwtPayload } from '../../types/jwt.types';
import {
    ICreateReviewPayload,
    IManagementAnalyzeByMenuInput,
    IManagementReviewFilters,
    IReviewPaginationOptions,
} from './review.types';
import { paginationHelpers } from '../../utils/pagination';
import { OrderStatus, Prisma } from '@prisma/client';
import { aiService } from '../aiService';

const reviewInclude = {
    customer: {
        include: {
            user: {
                select: {
                    id: true,
                    fullName: true,
                    avatar: true,
                },
            },
        },
    },
    menuProduct: {
        select: {
            id: true,
            productTitle: true,
            restaurantId: true,
            tenantId: true,
        },
    },
};

const getOrderBy = (sortBy?: string, sortOrder?: string) => {
    const allowedSortBy = new Set(['createdAt', 'updatedAt', 'rating']);
    const finalSortBy =
        sortBy && allowedSortBy.has(sortBy) ? sortBy : 'createdAt';
    const finalSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    return {
        [finalSortBy]: finalSortOrder,
    };
};

const createReview = async (
    user: JwtPayload,
    payload: ICreateReviewPayload,
    tenantId: string,
) => {
    const customer = await prisma.customer.findUnique({
        where: {
            userId: user.id,
            isDeleted: false,
        },
        select: { userId: true },
    });

    if (!customer) {
        throw new ApiError(httpstatus.FORBIDDEN, 'Customer profile not found');
    }

    const menuProduct = await prisma.menuProduct.findUnique({
        where: {
            id: payload.menuProductId,
            tenantId,
            isDeleted: false,
        },
        select: {
            id: true,
        },
    });

    if (!menuProduct) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Menu product not found');
    }

    const order = await prisma.order.findUnique({
        where: {
            id: payload.orderId,
            customerId: user.id,
            tenantId,
            isDeleted: false,
            status: OrderStatus.DELIVERED,
        },
        select: { id: true },
    });

    if (!order) {
        throw new ApiError(
            httpstatus.BAD_REQUEST,
            'You can only review delivered orders that belong to you',
        );
    }

    const itemInOrder = await prisma.orderItem.findFirst({
        where: {
            orderId: order.id,
            menuItemId: payload.menuProductId,
            isDeleted: false,
        },
        select: { id: true },
    });

    if (!itemInOrder) {
        throw new ApiError(
            httpstatus.BAD_REQUEST,
            'This menu item is not part of the provided order',
        );
    }

    const existingReview = await prisma.review.findUnique({
        where: {
            customerId_orderId_menuProductId: {
                customerId: user.id,
                orderId: payload.orderId,
                menuProductId: payload.menuProductId,
            },
        },
    });

    let reviewId = existingReview?.id;

    if (existingReview && !existingReview.isDeleted) {
        throw new ApiError(
            httpstatus.CONFLICT,
            'Review already exists for this menu item',
        );
    }

    const sentiment = payload.comment
        ? await aiService.sentimentAnalysis(payload.comment)
        : null;

    if (existingReview && existingReview.isDeleted) {
        const updated = await prisma.review.update({
            where: { id: existingReview.id },
            data: {
                rating: payload.rating,
                comment: payload.comment,
                sentiment,
                isDeleted: false,
                deletedBy: null,
                lastUpdatedBy: user.id,
            },
            select: { id: true },
        });

        reviewId = updated.id;
    } else {
        const created = await prisma.review.create({
            data: {
                customerId: user.id,
                orderId: payload.orderId,
                menuProductId: payload.menuProductId,
                rating: payload.rating,
                comment: payload.comment,
                sentiment,
                lastUpdatedBy: user.id,
            },
            select: { id: true },
        });

        reviewId = created.id;
    }

    const result = await prisma.review.findUnique({
        where: { id: reviewId },
        include: reviewInclude,
    });

    return result;
};

const getMyReviews = async (
    user: JwtPayload,
    tenantId: string,
    options: IReviewPaginationOptions,
) => {
    const { page, limit, skip, sortBy, sortOrder } =
        paginationHelpers.calculatePagination(options);

    const whereClause = {
        customerId: user.id,
        isDeleted: false,
        menuProduct: {
            tenantId,
            isDeleted: false,
        },
    };

    const [data, total] = await Promise.all([
        prisma.review.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: getOrderBy(sortBy, sortOrder) as any,
            include: reviewInclude,
        }),
        prisma.review.count({ where: whereClause }),
    ]);

    return {
        meta: {
            page,
            limit,
            total,
        },
        data,
    };
};

const getMyReviewsByOrder = async (
    user: JwtPayload,
    orderId: string,
    tenantId: string,
) => {
    const order = await prisma.order.findUnique({
        where: {
            id: orderId,
            customerId: user.id,
            tenantId,
            isDeleted: false,
        },
        select: {
            id: true,
        },
    });

    if (!order) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Order not found');
    }

    const reviews = await prisma.review.findMany({
        where: {
            customerId: user.id,
            orderId: order.id,
            isDeleted: false,
            menuProduct: {
                tenantId,
                isDeleted: false,
            },
        },
        orderBy: { createdAt: 'desc' },
        include: reviewInclude,
    });

    return reviews;
};

const getMyReviewsByMenuProduct = async (
    user: JwtPayload,
    menuProductId: string,
    tenantId: string,
) => {
    const menuProduct = await prisma.menuProduct.findUnique({
        where: {
            id: menuProductId,
            tenantId,
            isDeleted: false,
        },
        select: {
            id: true,
        },
    });

    if (!menuProduct) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Menu product not found');
    }

    const reviews = await prisma.review.findMany({
        where: {
            customerId: user.id,
            menuProductId,
            isDeleted: false,
        },
        orderBy: { createdAt: 'desc' },
        include: reviewInclude,
    });

    return reviews;
};

const managementGetAllReviews = async (
    tenantId: string,
    filters: IManagementReviewFilters,
    options: IReviewPaginationOptions,
) => {
    const { page, limit, skip, sortBy, sortOrder } =
        paginationHelpers.calculatePagination(options);

    let orderIdFilter: string | undefined;
    if (filters.orderId) {
        const order = await prisma.order.findUnique({
            where: {
                id: filters.orderId,
                tenantId,
                isDeleted: false,
            },
            select: { id: true },
        });

        if (!order) {
            throw new ApiError(httpstatus.NOT_FOUND, 'Order not found');
        }

        orderIdFilter = order.id;
    }

    const whereClause = {
        isDeleted: false,
        ...(filters.rating !== undefined ? { rating: filters.rating } : {}),
        ...(filters.customerId ? { customerId: filters.customerId } : {}),
        ...(filters.menuProductId
            ? { menuProductId: filters.menuProductId }
            : {}),
        ...(orderIdFilter ? { orderId: orderIdFilter } : {}),
        menuProduct: {
            tenantId,
            isDeleted: false,
        },
    };

    const [data, total] = await Promise.all([
        prisma.review.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: getOrderBy(sortBy, sortOrder) as any,
            include: reviewInclude,
        }),
        prisma.review.count({ where: whereClause }),
    ]);

    return {
        meta: {
            page,
            limit,
            total,
        },
        data,
    };
};

const managementGetReviewsByCustomer = async (
    customerId: string,
    tenantId: string,
    options: IReviewPaginationOptions,
) => {
    const customer = await prisma.customer.findUnique({
        where: {
            userId: customerId,
            isDeleted: false,
        },
        select: { userId: true },
    });

    if (!customer) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Customer not found');
    }

    const { page, limit, skip, sortBy, sortOrder } =
        paginationHelpers.calculatePagination(options);

    const whereClause = {
        customerId,
        isDeleted: false,
        menuProduct: {
            tenantId,
            isDeleted: false,
        },
    };

    const [data, total] = await Promise.all([
        prisma.review.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: getOrderBy(sortBy, sortOrder) as any,
            include: reviewInclude,
        }),
        prisma.review.count({ where: whereClause }),
    ]);

    return {
        meta: {
            page,
            limit,
            total,
        },
        data,
    };
};

const managementGetReviewsByMenuProduct = async (
    menuProductId: string,
    tenantId: string,
    options: IReviewPaginationOptions,
) => {
    const menuProduct = await prisma.menuProduct.findUnique({
        where: {
            id: menuProductId,
            tenantId,
            isDeleted: false,
        },
        select: {
            id: true,
        },
    });

    if (!menuProduct) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Menu product not found');
    }

    const { page, limit, skip, sortBy, sortOrder } =
        paginationHelpers.calculatePagination(options);

    const whereClause = {
        menuProductId,
        isDeleted: false,
        menuProduct: {
            tenantId,
            isDeleted: false,
        },
    };

    const [data, total] = await Promise.all([
        prisma.review.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: getOrderBy(sortBy, sortOrder) as any,
            include: reviewInclude,
        }),
        prisma.review.count({ where: whereClause }),
    ]);

    return {
        meta: {
            page,
            limit,
            total,
        },
        data,
    };
};

const managementGetReviewsByOrder = async (
    orderId: string,
    tenantId: string,
) => {
    const order = await prisma.order.findUnique({
        where: {
            id: orderId,
            tenantId,
            isDeleted: false,
        },
        select: {
            id: true,
            customerId: true,
        },
    });

    if (!order) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Order not found');
    }

    const reviews = await prisma.review.findMany({
        where: {
            customerId: order.customerId,
            orderId: order.id,
            isDeleted: false,
            menuProduct: {
                tenantId,
                isDeleted: false,
            },
        },
        orderBy: { createdAt: 'desc' },
        include: reviewInclude,
    });

    return reviews;
};

const managementAnalyzeByMenu = async (
    payload: IManagementAnalyzeByMenuInput,
    tenantId: string,
) => {
    const createdAt: Prisma.DateTimeFilter = {};

    if (payload.startDate) {
        createdAt.gte = new Date(payload.startDate);
    }

    if (payload.endDate) {
        const end = new Date(payload.endDate);
        end.setHours(23, 59, 59, 999);
        createdAt.lte = end;
    }

    if (createdAt.gte && createdAt.lte && createdAt.gte > createdAt.lte) {
        throw new ApiError(
            httpstatus.BAD_REQUEST,
            'startDate cannot be after endDate',
        );
    }

    const whereConditions: Prisma.ReviewWhereInput = {
        menuProductId: payload.menuId,
        isDeleted: false,
        menuProduct: {
            tenantId,
            isDeleted: false,
        },
        ...(Object.keys(createdAt).length ? { createdAt } : {}),
    };

    const reviews = await prisma.review.findMany({
        where: whereConditions,
        select: {
            comment: true,
        },
    });

    const comments: string[] = reviews
        .map(review => review.comment)
        .filter((comment): comment is string => !!comment?.trim());

    const analysis = await aiService.review_analyzer(comments);
    return analysis;
};

const managementGetReviewById = async (reviewId: string, tenantId: string) => {
    const review = await prisma.review.findFirst({
        where: {
            id: reviewId,
            isDeleted: false,
            menuProduct: {
                tenantId,
                isDeleted: false,
            },
        },
        include: reviewInclude,
    });

    if (!review) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Review not found');
    }

    return review;
};

const managementDeleteReview = async (
    reviewId: string,
    user: JwtPayload,
    tenantId: string,
) => {
    const review = await prisma.review.findFirst({
        where: {
            id: reviewId,
            isDeleted: false,
            menuProduct: {
                tenantId,
                isDeleted: false,
            },
        },
        select: { id: true },
    });

    if (!review) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Review not found');
    }

    const deleted = await prisma.review.update({
        where: { id: review.id },
        data: {
            isDeleted: true,
            deletedBy: user.id,
            lastUpdatedBy: user.id,
        },
        select: { id: true },
    });

    return deleted;
};

export const reviewService = {
    createReview,
    getMyReviews,
    getMyReviewsByOrder,
    getMyReviewsByMenuProduct,
    managementGetAllReviews,
    managementGetReviewsByCustomer,
    managementGetReviewsByMenuProduct,
    managementGetReviewsByOrder,
    managementAnalyzeByMenu,
    managementGetReviewById,
    managementDeleteReview,
};
