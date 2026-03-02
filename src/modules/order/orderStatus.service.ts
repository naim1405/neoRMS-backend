import ApiError from '../../utils/ApiError';
import httpStatus from 'http-status';
import prisma from '../../utils/prisma';
import { IOrder, IUpdateOrderRequest, IOrderStats } from './orderStatus.types';
import { OrderStatus, OrderType, UserRole } from '@prisma/client';
import { JwtPayload } from '../../types/jwt.types';

/**
 * Create a new order
 */
const createOrder = async (requestingUser: JwtPayload, orderData: IOrder) => {
    try {
        // For customers, always use their own id — never trust body customerId
        const customerId =
            requestingUser.role === UserRole.CUSTOMER
                ? requestingUser.id
                : orderData.customerId;

        if (!customerId) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                'customerId is required when placing an order as staff',
            );
        }

        // Validate restaurant belongs to this tenant
        const restaurant = await prisma.restaurant.findUnique({
            where: { id: orderData.restaurantId, isDeleted: false },
            select: { id: true, tenantId: true },
        });
        if (!restaurant) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                'Restaurant not found or does not belong to this tenant',
            );
        }

        // Validate tableId belongs to this restaurant/tenant
        if (orderData.tableId) {
            const table = await prisma.table.findUnique({
                where: { id: orderData.tableId, isDeleted: false },
                select: {
                    id: true,
                    restaurantId: true,
                    tenantId: true,
                },
            });
            if (!table || table.restaurantId !== orderData.restaurantId) {
                throw new ApiError(
                    httpStatus.BAD_REQUEST,
                    'Table not found or does not belong to this restaurant',
                );
            }
        }

        // Enrich items with variantType snapshot from the selected variant
        const variantIds = orderData.items
            .map(item => item.variantId)
            .filter(Boolean);

        const variantTypeMap: Record<string, string> = {};
        if (variantIds.length > 0) {
            const variants = await prisma.variant.findMany({
                where: { id: { in: variantIds } },
                select: { id: true, type: true },
            });
            for (const v of variants) {
                variantTypeMap[v.id] = v.type;
            }
        }

        const enrichedItems = orderData.items.map((item: any) => ({
            ...item,
            ...(item.variantId && variantTypeMap[item.variantId]
                ? { variantType: variantTypeMap[item.variantId] }
                : {}),
        }));

        const order = await prisma.order.create({
            data: {
                customerId,
                restaurantId: orderData.restaurantId,
                tenantId: restaurant.tenantId,
                status: OrderStatus.PENDING,
                orderType: orderData.orderType,
                ...(orderData.tableId && { tableId: orderData.tableId }),
                totalPrice: orderData.totalPrice,
                paymentMethod: orderData.paymentMethod,
                notes: orderData.notes,
                estimatedDeliveryTimeInMinutes:
                    orderData.estimatedDeliveryTimeInMinutes,
                lastUpdatedBy: requestingUser.id,
                items: {
                    create: enrichedItems,
                },
            },
            include: {
                items: true,
            },
        });

        return order;
    } catch (error) {
        console.error('🚀 error : ', error);
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
    tenantId: string,
) => {
    try {
        // Staff or the user themselves can access the stats
        const isStaff = (
            [UserRole.WAITER, UserRole.MANAGER, UserRole.OWNER] as UserRole[]
        ).includes(requestingUser.role);

        if (!isStaff && requestingUser.id !== targetUserID) {
            throw new ApiError(
                httpStatus.FORBIDDEN,
                'You do not have permission to view these order statistics',
            );
        }

        // base where clause — exclude soft-deleted orders
        const baseWhereClause = {
            customerId: targetUserID,
            tenantId: tenantId,
            isDeleted: false,
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
            prisma.order.count({
                where: baseWhereClause,
            }),
            prisma.order.count({
                where: {
                    ...baseWhereClause,
                    status: OrderStatus.PENDING,
                },
            }),
            prisma.order.count({
                where: {
                    ...baseWhereClause,
                    status: OrderStatus.CONFIRMED,
                },
            }),
            prisma.order.count({
                where: {
                    ...baseWhereClause,
                    status: OrderStatus.PREPARING,
                },
            }),
            prisma.order.count({
                where: {
                    ...baseWhereClause,
                    status: OrderStatus.DELIVERED,
                },
            }),
            prisma.order.count({
                where: {
                    ...baseWhereClause,
                    status: OrderStatus.CANCELLED,
                },
            }),
            prisma.order.count({
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
        const order = await prisma.order.findUnique({
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
            [
                UserRole.OWNER,
                UserRole.WAITER,
                UserRole.CHEF,
                UserRole.MANAGER,
            ] as UserRole[]
        ).includes(requestingUser.role);

        const isCustomerOwnerOfOrder = order.customerId === requestingUser.id;

        if (!isStaff && !isCustomerOwnerOfOrder) {
            throw new ApiError(
                httpStatus.FORBIDDEN,
                'You do not have permission to track this order',
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
) => {
    try {
        const order = await prisma.order.findUnique({
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

        if (!isStaff && !isCustomerOwnerOfOrder) {
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
 * Get all orders for a user by status and order Type with pagination
 */
const getOrderByStatusAndOrderType = async (
    requestingUser: JwtPayload,
    tenantId: string,
    status?: OrderStatus,
    limit: number = 10,
    page: number = 1,
    orderType?: OrderType,
) => {
    try {
        const skip = (page - 1) * limit;

        // Base where clause with tenant isolation
        const whereClause: any = {
            tenantId: tenantId,
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
            prisma.order.findMany({
                where: whereClause,
                include: { items: true },
                take: limit,
                skip: skip,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.order.count({
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
) => {
    try {
        const order = await prisma.order.findUnique({
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
            [
                UserRole.WAITER,
                UserRole.CHEF,
                UserRole.MANAGER,
                UserRole.OWNER,
            ] as UserRole[]
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

        const updatedOrder = await prisma.order.update({
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
) => {
    try {
        const order = await prisma.order.findUnique({
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
            [UserRole.WAITER, UserRole.MANAGER, UserRole.OWNER] as UserRole[]
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

        // Enrich replacement items with variantType snapshot
        const { items, ...scalarFields } = updateData;
        let enrichedItems = items;
        if (items && items.length > 0) {
            const variantIds = items
                .map((item: any) => item.variantId)
                .filter(Boolean);
            const variantTypeMap: Record<string, string> = {};
            if (variantIds.length > 0) {
                const variants = await prisma.variant.findMany({
                    where: { id: { in: variantIds } },
                    select: { id: true, type: true },
                });
                for (const v of variants) {
                    variantTypeMap[v.id] = v.type;
                }
            }
            enrichedItems = items.map((item: any) => ({
                ...item,
                ...(item.variantId && variantTypeMap[item.variantId]
                    ? { variantType: variantTypeMap[item.variantId] }
                    : {}),
            }));
        }

        const updatedOrder = await prisma.order.update({
            where: {
                id: orderId,
                tenantId: tenantId,
            },
            data: {
                ...scalarFields,
                ...(enrichedItems && {
                    items: {
                        deleteMany: { orderId: orderId },
                        createMany: { data: enrichedItems },
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
        const order = await prisma.order.findUnique({
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
            const waiterAllowedStatuses: OrderStatus[] = [
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
        await prisma.order.update({
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
        const order = await prisma.order.findUnique({
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

        await prisma.order.delete({
            where: {
                id: orderId, // tenantId already verified by findUnique above
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

/**
 * Get paginated order history for the requesting user
 */
const getUserOrders = async (
    requestingUser: JwtPayload,
    tenantId: string,
    filters: {
        status?: OrderStatus;
        orderType?: OrderType;
        limit?: number;
        page?: number;
    },
) => {
    try {
        const { status, orderType, limit = 10, page = 1 } = filters;
        const skip = (page - 1) * limit;

        const whereClause: any = {
            tenantId,
            isDeleted: false,
            customerId: requestingUser.id, // always scoped to the requesting user
        };

        if (status) whereClause.status = status;
        if (orderType) whereClause.orderType = orderType;

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where: whereClause,
                include: { items: true },
                take: limit,
                skip,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.order.count({ where: whereClause }),
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
            'Failed to fetch order history',
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
    getUserOrders,
};
