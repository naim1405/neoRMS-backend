import ApiError from '../../utils/ApiError';
import httpStatus from 'http-status';
import prisma from '../../utils/prisma';
import { IOrder, IUpdateOrderRequest, IOrderStats } from './orderStatus.types';
import { OrderStatus, OrderType, UserRole } from '@prisma/client';


/**
 * Get statistics for a user's orders (total, pending, completed, cancelled counts)
 */
const getOrderStatsByUserID = async (userIdtoFindStats: string, CurrUserrole: string): Promise<IOrderStats> => {
    try {

        const totalOrders = await (prisma as any).order.count({
            where: { userId: userIdtoFindStats },
        });

        const pendingOrders = await (prisma as any).order.count({
            where: {
                userId: userIdtoFindStats,
                status: OrderStatus.PENDING
            },
        });

        const confirmedOrders = await (prisma as any).order.count({
            where: {
                userId: userIdtoFindStats,
                status: OrderStatus.CONFIRMED
            },
        });

        const preparingOrders = await (prisma as any).order.count({
            where: {
                userId: userIdtoFindStats,
                status: OrderStatus.PREPARING
            },
        });

        const completedOrders = await (prisma as any).order.count({
            where: {
                userId: userIdtoFindStats,
                status: OrderStatus.DELIVERED,
            },
        });

        const cancelledOrders = await (prisma as any).order.count({
            where: {
                userId: userIdtoFindStats,
                status: OrderStatus.CANCELLED,
            },
        });

        const readyOrders = await (prisma as any).order.count({
            where: {
                userId: userIdtoFindStats,
                status: OrderStatus.READY,
            },
        });

        return {
            totalOrders,
            pendingOrders,
            completedOrders,
            cancelledOrders,
            confirmedOrders,
            preparingOrders,
            readyOrders
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
const trackOrder = async (orderId: string, userId: string, userRole: string) => {
    try {
        const order = await (prisma as any).order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });

        // 1. Check if order exists first
        if (!order) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
        }

        // 2. Permission Logic:
        // STAFF (Waiter, Chef, Manager) can see any order.
        // CUSTOMERS can only see their own orders.
        const isStaff = [UserRole.WAITER, UserRole.CHEF, UserRole.MANAGER].includes(userRole as any);
        const isCustomerOwnerOfOrder = order.userId === userId;

        if (!isStaff && !isCustomerOwnerOfOrder) {
            throw new ApiError(
                httpStatus.FORBIDDEN,
                'You do not have permission to track this order',
            );
        }

        return {
            orderId: order.id,
            status: order.status,
            estimatedDeliveryTimeInMinutes: order.estimatedDeliveryTimeInMinutes,
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
const getOrderById = async (orderId: string, userId: string, userRole: string): Promise<IOrder> => {
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

        // STAFF (Waiter, Chef, Manager) can see any order.
        // CUSTOMERS can only see their own orders.
        const isStaff = [UserRole.WAITER, UserRole.CHEF, UserRole.MANAGER].includes(userRole as any);
        const isCustomerOwnerOfOrdedr = order.userId === userId;

        if (!isStaff && !isCustomerOwnerOfOrdedr) {
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
const updateOrderStatus = async (
    orderId: string,
    userId: string,
    userRole: string,
    status: OrderStatus,
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

        const isStaff = [UserRole.WAITER, UserRole.CHEF, UserRole.MANAGER].includes(userRole as any);

        if (!isStaff && order.userId !== userId) {
            throw new ApiError(
                httpStatus.FORBIDDEN,
                'You do not have permission to update this order',
            );
        }

        const validTransitions: { [key: string]: OrderStatus[] } = {
            [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
            [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
            [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
            [OrderStatus.READY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
            [OrderStatus.DELIVERED]: [],
            [OrderStatus.CANCELLED]: [],
        };

        const allowedTransitions = validTransitions[order.status] || [];
        if (!allowedTransitions.includes(status)) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                `Invalid status transition from ${order.status} to ${status}`,
            );
        }

        const updatedOrder = await (prisma as any).order.update({
            where: {
                id: orderId,
            },
            data: { status },
            include: {
                items: true,
            },
        });

        return updatedOrder;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            'Failed to update order status',
        );
    }
};


/**
 * Helper function to convert order status to progress bar step (0-5)
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


/**
 * Update order 
 */
const updateOrder = async (
    orderId: string,
    userId: string,
    userRole: string,
    updateData: IUpdateOrderRequest,
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

        const isStaff = [UserRole.WAITER, UserRole.MANAGER].includes(userRole as any);

        if (!isStaff && order.userId !== userId) {
            throw new ApiError(
                httpStatus.FORBIDDEN,
                'You do not have permission to update this order',
            );
        }

        if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED || order.status === OrderStatus.READY || order.status === OrderStatus.PREPARING) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                'Cannot update an order that is already delivered, cancelled, ready or preparing',
            );
        }

        const updatedOrder = await (prisma as any).order.update({
            where: {
                id: orderId,
            },
            data: updateData,
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
const deleteOrder = async (orderId: string, userId: string, userRole: string) => {
    try {
        const order = await (prisma as any).order.findUnique({
            where: {
                id: orderId,
            },
        });

        if (!order) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
        }

        // Only allow deletion if user is the owner or a staff member
        const isStaff = [UserRole.WAITER, UserRole.MANAGER].includes(userRole as any);
        if (!isStaff && order.userId !== userId) {
            throw new ApiError(
                httpStatus.FORBIDDEN,
                'You do not have permission to delete this order',
            );
        }

        // can not delete order if order is confirmed or preparing or ready
        if (order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.PREPARING || order.status === OrderStatus.READY) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                'Cannot delete an order that is already confirmed, preparing or ready',
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
 * Create a new order
 */
const createOrder = async (
    userId: string,
    orderData: any,
): Promise<IOrder> => {
    try {
        const order = await (prisma as any).order.create({
            data: {
                userId,
                status: OrderStatus.PENDING,
                orderType: orderData.orderType,
                totalPrice: orderData.totalPrice,
                paymentMethod: orderData.paymentMethod,
                notes: orderData.notes,
                estimatedDeliveryTimeInMinutes: orderData.estimatedDeliveryTimeInMinutes,
                items: {
                    create: orderData.items,
                },
            },
            include: {
                items: true,
            },
        });

        return order;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            'Failed to create order',
        );
    }
};

/**
 * Get all orders for a user by status and order Type with pagination
 */
const getOrderByStatusAndOrderType = async (
    userId: string,
    role: string,   
    status?: OrderStatus,
    limit: number = 10,
    page: number = 1,
    orderType?: OrderType,
) => {
    try {
        const skip = (page - 1) * limit;

        // 1. Build Dynamic Where Clause
        const whereClause: any = {};

        if (role === UserRole.CUSTOMER) {
            whereClause.userId = userId;
        }

        if (status) {
            whereClause.status = status;
        }

        if (orderType) {
            whereClause.orderType = orderType;
        }

        // 2. Parallel Execution (Faster)
        const [orders, total] = await Promise.all([
            (prisma as any).order.findMany({
                where: whereClause,
                include: { items: true },
                take: limit,
                skip: skip,
                orderBy: { createdAt: 'desc' },
            }),
            (prisma as any).order.count({
                where: whereClause,
            }),
        ]);

        return {
            data: orders,
            meta: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                },
        };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to fetch orders');
    }
};


export const orderStatusService = {
    getOrderStatsByUserID,
    trackOrder,
    updateOrder,
    getOrderById,
    updateOrderStatus,
    deleteOrder,
    createOrder,
    getOrderByStatusAndOrderType,
};
