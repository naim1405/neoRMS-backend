import ApiError from '../../utils/ApiError';
import httpStatus from 'http-status';
import prisma from '../../utils/prisma';
import { IOrder, IUpdateOrderRequest, IOrderStats } from './orderStatus.types';
import { OrderStatus } from '@prisma/client';

/**
 * Get all orders for a user with pagination and optional status filter
 */
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
                items: true,
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
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            'Failed to fetch user orders',
        );
    }
};

/**
 * Get statistics for a user's orders (total, pending, completed, cancelled counts)
 */
const getOrderStats = async (userId: string): Promise<IOrderStats> => {
    try {
        const totalOrders = await (prisma as any).order.count({
            where: { userId: userId },
        });

        const pendingOrders = await (prisma as any).order.count({
            where: {
                userId: userId,
                status: { in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING] },
            },
        });

        const completedOrders = await (prisma as any).order.count({
            where: {
                userId: userId,
                status: OrderStatus.DELIVERED,
            },
        });

        const cancelledOrders = await (prisma as any).order.count({
            where: {
                userId: userId,
                status: OrderStatus.CANCELLED,
            },
        });

        return {
            totalOrders,
            pendingOrders,
            completedOrders,
            cancelledOrders,
        };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            'Failed to fetch order statistics',
        );
    }
};

/**
 * Track order status in real-time with current progress step
 */
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

/**
 * Get single order by ID with authorization check
 */
const getOrderById = async (orderId: string, userId: string): Promise<IOrder> => {
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

/**
 * Update order with authorization and status transition validation
 */
const updateOrder = async (
    orderId: string,
    userId: string,
    updatedData: IUpdateOrderRequest,
): Promise<IOrder> => {
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
                'You do not have permission to update this order',
            );
        }

        // Validate status transitions if status is being updated
        if (updatedData.status) {
            const validTransitions: { [key: string]: OrderStatus[] } = {
                [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
                [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
                [OrderStatus.PREPARING]: [OrderStatus.READY],
                [OrderStatus.READY]: [OrderStatus.DELIVERED],
                [OrderStatus.DELIVERED]: [],
                [OrderStatus.CANCELLED]: [],
            };

            const allowedTransitions = validTransitions[order.status] || [];
            if (!allowedTransitions.includes(updatedData.status)) {
                throw new ApiError(
                    httpStatus.BAD_REQUEST,
                    `Invalid status transition from ${order.status} to ${updatedData.status}`,
                );
            }
        }

        const updatedOrder = await (prisma as any).order.update({
            where: {
                id: orderId,
            },
            data: updatedData,
            include: {
                items: true,
            },
        });

        return updatedOrder;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            'Failed to update order',
        );
    }
};

/**
 * Delete order with ownership verification
 */
const deleteOrder = async (orderId: string, userId: string) => {
    try {
        const order = await (prisma as any).order.findUnique({
            where: {
                id: orderId,
            },
        });

        if (!order) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
        }

        // Only allow deletion if user is the owner
        if (order.userId !== userId) {
            throw new ApiError(
                httpStatus.FORBIDDEN,
                'You do not have permission to delete this order',
            );
        }

        // Delete order (cascading delete handled by Prisma schema)
        await (prisma as any).order.delete({
            where: {
                id: orderId,
            },
        });

        return { id: orderId };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            'Failed to delete order',
        );
    }
};

/**
 * Helper function to convert order status to progress step (0-5)
 */
const getOrderStep = (status: OrderStatus): number => {
    const steps: { [key in OrderStatus]: number } = {
        [OrderStatus.PENDING]: 1,
        [OrderStatus.CONFIRMED]: 2,
        [OrderStatus.PREPARING]: 3,
        [OrderStatus.READY]: 4,
        [OrderStatus.DELIVERED]: 5,
        [OrderStatus.CANCELLED]: 0,
    };
    return steps[status] || 0;
};

export const orderStatusService = {
    getUserOrders,
    getOrderStats,
    trackOrder,
    getOrderById,
    updateOrder,
    deleteOrder,
};
