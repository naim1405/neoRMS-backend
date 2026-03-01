import ApiError from '../../utils/ApiError';
import httpStatus from 'http-status';
import prisma from '../../utils/prisma';
import { IOrder, IUpdateOrderRequest, IOrderStats } from './orderStatus.types';
import { Order, OrderStatus, OrderType, UserRole } from '@prisma/client';
import { JwtPayload } from '../../types/jwt.types';
import { is } from 'zod/v4/locales';

/**
 * Create a new order
 */
const createOrder = async (
    requestingUser: JwtPayload,
    orderData: any,
    tenantId: string,
): Promise<IOrder> => {
    try {
        // check Tenant match
        if (orderData.tenantId !== tenantId) {
            throw new ApiError(
                httpStatus.FORBIDDEN,
                'You do not have permission to create an order (tenant mismatch)',
            );
        }

        // customer can create only their orders
        if (
            requestingUser.role === UserRole.CUSTOMER &&
            orderData.customerId !== requestingUser.id
        ) {
            throw new ApiError(
                httpStatus.FORBIDDEN,
                'Customers can only create their own orders',
            );
        }

        const order = await (prisma as any).order.create({
            data: {
                customerId: orderData.customerId, // customerId is passed in the request body
                restasurantId: orderData.restaurantId,
                tenantId: orderData.tenantId,
                status: OrderStatus.PENDING,
                orderType: orderData.orderType,

                totalPrice: orderData.totalPrice,
                paymentMethod: orderData.paymentMethod,
                notes: orderData.notes,
                estimatedDeliveryTimeInMinutes:
                    orderData.estimatedDeliveryTimeInMinutes,
                lastUpdatedBy: requestingUser.id, // Track who created the order
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
 * Get statistics for a user's orders (total, pending, completed, cancelled counts)
 */
const getOrderStatsByUserID = async (
    targetUserID: string,
    requestingUser: JwtPayload,
    tenentId: string,
): Promise<IOrderStats> => {
    try {
        // Saff or the user themselves can access the stats
        const isStaff = (
            [UserRole.WAITER, UserRole.MANAGER, UserRole.OWNER] as UserRole[]
        ).includes(requestingUser.role);

        if (!isStaff && requestingUser.id !== targetUserID) {
            throw new ApiError(
                httpStatus.FORBIDDEN,
                'You do not have permission to view these order statistics',
            );
        }

        // base where clause
        const baseWhereClause = {
            customerId: targetUserID,
            tenantId: tenentId, // tenant isolation
        };

        const [
            totalOrders,
            pendingOrders,
            confirmedOrders,
            preparingOrders,
            completedOrders,
            cancelledOrders,
            readyOrders,
        ] = await Promise.all([
            (prisma as any).order.count({
                where: baseWhereClause,
            }),
            (prisma as any).order.count({
                where: {
                    ...baseWhereClause,
                    status: OrderStatus.PENDING,
                },
            }),
            (prisma as any).order.count({
                where: {
                    ...baseWhereClause,
                    status: OrderStatus.CONFIRMED,
                },
            }),
            (prisma as any).order.count({
                where: {
                    ...baseWhereClause,
                    status: OrderStatus.PREPARING,
                },
            }),
            (prisma as any).order.count({
                where: {
                    ...baseWhereClause,
                    status: OrderStatus.DELIVERED,
                },
            }),
            (prisma as any).order.count({
                where: {
                    ...baseWhereClause,
                    status: OrderStatus.CANCELLED,
                },
            }),
            (prisma as any).order.count({
                where: { ...baseWhereClause, status: OrderStatus.READY },
            }),
        ]);
        return {
            totalOrders,
            pendingOrders,
            completedOrders,
            cancelledOrders,
            confirmedOrders,
            preparingOrders,
            readyOrders,
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
const trackOrder = async (
    orderId: string,
    requestingUser: JwtPayload,
    tenantId: string,
) => {
    try {
        const order = await (prisma as any).order.findUnique({
            where: {
                id: orderId,
                tenantId: tenantId,
                isDeleted: false,
            },
            include: { items: true },
        });

        // 1. Check if order exists first
        if (!order) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
        }

        // 2. Permission Logic:
        // STAFF (Waiter, Chef, Manager) can see any order.
        // CUSTOMERS can only see their own orders.
        const isStaff = (
            [UserRole.WAITER, UserRole.CHEF, UserRole.MANAGER] as UserRole[]
        ).includes(requestingUser.role);

        const isCustomerOwnerOfOrder = order.customerId === requestingUser.id;
        const isTenantMatch = order.tenantId === tenantId;

        if (!isStaff && !isCustomerOwnerOfOrder) {
            throw new ApiError(
                httpStatus.FORBIDDEN,
                'You do not have permission to track this order',
            );
        }

        if (!isTenantMatch) {
            throw new ApiError(
                httpStatus.FORBIDDEN,
                'You do not have permission to track this order (tenant mismatch)',
            );
        }

        return {
            orderId: order.id,
            status: order.status,
            estimatedDeliveryTimeInMinutes:
                order.estimatedDeliveryTimeInMinutes,
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
 * Get single order by ID with authorization check
 */
const getOrderById = async (
    orderId: string,
    requestingUser: JwtPayload,
    tenantId: string,
): Promise<IOrder> => {
    try {
        const order = await (prisma as any).order.findUnique({
            where: {
                id: orderId,
                tenantId: tenantId,
                isDeleted: false,
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
        const isStaff = (
            [UserRole.WAITER, UserRole.CHEF, UserRole.MANAGER] as UserRole[]
        ).includes(requestingUser.role);
        const isCustomerOwnerOfOrder = order.customerId === requestingUser.id;

        // Tenant match
        const isTenantMatch = order.tenantId === tenantId;

        if (!isStaff && !isCustomerOwnerOfOrder) {
            throw new ApiError(
                httpStatus.FORBIDDEN,
                'You do not have permission to view this order',
            );
        }

        if (!isTenantMatch) {
            throw new ApiError(
                httpStatus.FORBIDDEN,
                'You do not have permission to view this order (tenant mismatch)',
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
 * Get all orders for a user by status and order Type with pagination
 */
const getOrderByStatusAndOrderType = async (
    requestingUser: JwtPayload,
    TenantId: string,
    status?: OrderStatus,
    limit: number = 10,
    page: number = 1,
    orderType?: OrderType,
) => {
    try {
        const skip = (page - 1) * limit;

        // Base where clause with tenant isolation
        const whereClause: any = {
            tenantId: TenantId,
            isDeleted: false,
        };

        if (requestingUser.role === UserRole.CUSTOMER) {
            whereClause.customerId = requestingUser.id;
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
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            'Failed to fetch orders',
        );
    }
};

/**
 * Update order with authorization and status transition validation
 */
const updateOrderStatus = async (
    orderId: string,
    requestingUser: JwtPayload,
    status: OrderStatus,
    tenantId: string,
): Promise<IOrder> => {
    try {
        const order = await (prisma as any).order.findUnique({
            where: {
                id: orderId,
                tenantId: tenantId,
                isDeleted: false,
            },
            include: {
                items: true,
            },
        });

        if (!order) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
        }

        const isStaff = (
            [UserRole.WAITER, UserRole.CHEF, UserRole.MANAGER] as UserRole[]
        ).includes(requestingUser.role);

        const isCustomerOwnerOfOrder = order.customerId === requestingUser.id;

        if (!isStaff && !isCustomerOwnerOfOrder) {
            throw new ApiError(
                httpStatus.FORBIDDEN,
                'You do not have permission to update this order',
            );
        }

        // Customer can ONLY cancel their own PENDING order
        if (!isStaff && isCustomerOwnerOfOrder) {
            if (
                order.status !== OrderStatus.PENDING ||
                status !== OrderStatus.CANCELLED
            ) {
                throw new ApiError(
                    httpStatus.FORBIDDEN,
                    'Customers can only cancel a pending order',
                );
            }
        }

        if (order.tenantId !== tenantId) {
            throw new ApiError(
                httpStatus.FORBIDDEN,
                'You do not have permission to update this order (tenant mismatch)',
            );
        }

        const validTransitions: { [key: string]: OrderStatus[] } = {
            [OrderStatus.PENDING]: [
                OrderStatus.CONFIRMED,
                OrderStatus.CANCELLED,
            ],
            [OrderStatus.CONFIRMED]: [
                OrderStatus.PREPARING,
                OrderStatus.CANCELLED,
            ],
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
                tenantId: tenantId,
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
 * Update order
 */
const updateOrder = async (
    orderId: string,
    requestingUser: JwtPayload,
    updateData: IUpdateOrderRequest,
    tenantId: string,
): Promise<IOrder> => {
    try {
        const order = await (prisma as any).order.findUnique({
            where: {
                id: orderId,
                tenantId: tenantId, // tenant isolation at query level
                isDeleted: false,
            },
            include: { items: true },
        });

        if (!order) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
        }

        const isStaff = (
            [UserRole.WAITER, UserRole.MANAGER] as UserRole[]
        ).includes(requestingUser.role);

        const isCustomerOwnerOfOrder = order.customerId === requestingUser.id;

        if (!isStaff && !isCustomerOwnerOfOrder) {
            throw new ApiError(
                httpStatus.FORBIDDEN,
                'You do not have permission to update this order',
            );
        }

        // ← allowlist instead of blocklist — only PENDING is editable
        if (order.status !== OrderStatus.PENDING) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                'Order can only be updated while in PENDING status',
            );
        }

        // Customers have restricted field access
        if (!isStaff && isCustomerOwnerOfOrder) {
            const allowedFields = [
                'items',
                'paymentMethod',
                'notes',
                'orderType',
            ];
            const hasDisallowedFields = Object.keys(updateData).some(
                field => !allowedFields.includes(field),
            );
            if (hasDisallowedFields) {
                throw new ApiError(
                    httpStatus.FORBIDDEN,
                    'Customers can only update items, paymentMethod, notes and orderType',
                );
            }
        }

        // ← separate items from scalar fields — items need nested Prisma writes
        const { items, ...scalarFields } = updateData;

        const updatedOrder = await (prisma as any).order.update({
            where: {
                id: orderId,
                tenantId: tenantId,
            },
            data: {
                ...scalarFields,
                ...(items && {
                    items: {
                        deleteMany: { orderId: orderId }, // wipe existing items
                        createMany: { data: items }, // replace with new ones
                    },
                }),
            },
            include: { items: true },
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
 * soft Delete order - update isDeleted flag to true
 */
const deleteOrder = async (
    orderId: string,
    requestingUser: JwtPayload,
    tenantId: string,
) => {
    try {
        const order = await (prisma as any).order.findUnique({
            where: {
                id: orderId,
                tenantId: tenantId, // tenant isolation
                isDeleted: false,
            },
        });

        if (!order) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
        }

        const isCustomerOwnerOfOrder = order.customerId === requestingUser.id;
        const role = requestingUser.role as UserRole;

        // Permission + status rules per role
        if (role === UserRole.CUSTOMER) {
            if (!isCustomerOwnerOfOrder) {
                throw new ApiError(
                    httpStatus.FORBIDDEN,
                    'You do not have permission to delete this order',
                );
            }
            if (order.status !== OrderStatus.PENDING) {
                throw new ApiError(
                    httpStatus.BAD_REQUEST,
                    'Customers can only delete orders in PENDING status',
                );
            }
        } else if (role === UserRole.WAITER) {
            const waiterAllowedStatuses = [
                OrderStatus.PENDING,
                OrderStatus.CANCELLED,
                OrderStatus.DELIVERED,
            ];
            if (!waiterAllowedStatuses.includes(order.status)) {
                throw new ApiError(
                    httpStatus.BAD_REQUEST,
                    'Waiters can only delete orders that are pending, cancelled or delivered',
                );
            }
        } else if (role === UserRole.MANAGER || role === UserRole.OWNER) {
            // Can delete in any status — no restriction
        } else {
            throw new ApiError(
                httpStatus.FORBIDDEN,
                'You do not have permission to delete this order',
            );
        }

        // Soft delete — mark as deleted, record who deleted it
        await (prisma as any).order.update({
            where: {
                id: orderId,
                tenantId: tenantId,
            },
            data: {
                isDeleted: true,
                deletedBy: requestingUser.id,
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

/** * Hard delete order - permanently remove from database (admin/owner only) - ifnisDelete true
 */
const hardDeleteOrder = async (
    orderId: string,
    requestingUser: JwtPayload,
    tenantId: string,
) => {
    try {
        const order = await (prisma as any).order.findUnique({
            where: {
                id: orderId,
                tenantId: tenantId,
            },
        });

        if (!order) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
        }

        // Only MANAGER and OWNER can hard delete — no status restriction
        const canHardDelete = (
            [UserRole.MANAGER, UserRole.OWNER] as UserRole[]
        ).includes(requestingUser.role);

        if (!canHardDelete) {
            throw new ApiError(
                httpStatus.FORBIDDEN,
                'Only managers and owners can permanently delete orders',
            );
        }

        if (!order.isDeleted) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                'Order must be soft deleted before it can be permanently deleted',
            );
        }

        await (prisma as any).order.delete({
            where: {
                id: orderId,
                tenantId: tenantId,
            },
        });

        return { id: orderId };
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            'Failed to permanently delete order',
        );
    }
};

export const orderStatusService = {
    getOrderStatsByUserID,
    trackOrder,
    updateOrder,
    getOrderById,
    updateOrderStatus,
    deleteOrder,
    hardDeleteOrder,
    createOrder,
    getOrderByStatusAndOrderType,
};
