import ApiError from '../../utils/ApiError';
import httpStatus from 'http-status';
import prisma from '../../utils/prisma';
import { IOrder, OrderStatus } from './orderStatus.types';
import { JwtPayload } from '../../types/jwt.types';

const getOrderById = async (orderId: string, userId: string) => {
    try {
        const order = await (prisma as any).order.findUnique({
            where: {
                id: orderId,
            },
            include: {
                items: true, // NOTE: Assuming Order has items relation as must be included
            },
        });

        if (!order) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
        }

        // Verify that the order belongs to the user
        if (order.userId !== userId) {
            throw new ApiError(
                httpStatus.FORBIDDEN,
                'You do not have permission to view this order',
            );
        }

        return order;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            'Failed to fetch order',
        );
    }
};

const getUserOrders = async (
    userId: string,
    limit: number = 10,
    page: number = 1,
    status?: OrderStatus,
) => {
    try {
        const skip = (page - 1) * limit;

        const whereClause: any = {
            userId: userId,
        };

        if (status) {
            whereClause.status = status;
        }

        const orders = await (prisma as any).order.findMany({
            take: limit,
            skip: skip,
            where: whereClause,
            include: {
                items: true, // NOTE: Assuming Order has items relation
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        const total = await (prisma as any).order.count({
            where: whereClause,
        });

        return {
            data: orders,
            meta: {
                page,
                limit,
                total,
            },
        };
    } catch (error) {
        throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            'Failed to fetch user orders',
        );
    }
};

const trackOrder = async (orderId: string, userId: string) => {
    try {
        const order = await (prisma as any).order.findUnique({
            where: {
                id: orderId,
            },
            include: {
                items: true,
            },
        });

        if (!order) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
        }

        if (order.userId !== userId) {
            throw new ApiError(
                httpStatus.FORBIDDEN,
                'You do not have permission to track this order',
            );
        }

        // Return order
        return {
            orderId: order.id,
            status: order.status,
            estimatedDeliveryTime: order.estimatedDeliveryTime,
            currentStep: getOrderStep(order.status),
            updatedAt: order.updatedAt,
        };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            'Failed to track order',
        );
    }
};

// Helper function to get order progress step
const getOrderStep = (status: string): number => {
    const steps: { [key: string]: number } = {
        [OrderStatus.PENDING]: 1,
        [OrderStatus.CONFIRMED]: 2,
        [OrderStatus.PREPARING]: 3,
        [OrderStatus.READY]: 4,
        [OrderStatus.DELIVERED]: 5,
        [OrderStatus.CANCELLED]: 0,
    };
    return steps[status] || 0;
};

const getOrderStats = async (userId: string) => {
    try {
        const totalOrders = await (prisma as any).order.count({
            where: { userId: userId },
        });

        const pendingOrders = await (prisma as any).order.count({
            where: {
                userId: userId,
                status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] },
            },
        });

        const completedOrders = await (prisma as any).order.count({
            where: {
                userId: userId,
                status: 'DELIVERED',
            },
        });

        const cancelledOrders = await (prisma as any).order.count({
            where: {
                userId: userId,
                status: 'CANCELLED',
            },
        });

        return {
            totalOrders,
            pendingOrders,
            completedOrders,
            cancelledOrders,
        };
    } catch (error) {
        throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            'Failed to fetch order statistics',
        );
    }
};

export const orderStatusService = {
    getOrderById,
    getUserOrders,
    trackOrder,
    getOrderStats,
};
