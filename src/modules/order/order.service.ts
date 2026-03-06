import ApiError from '../../utils/ApiError';
import httpStatus from 'http-status';
import prisma from '../../utils/prisma';
import { IUpdateOrderRequest, ICreateOrderRequest } from './order.types';
import { OrderStatus, Prisma, UserRole } from '@prisma/client';
import { JwtPayload } from '../../types/jwt.types';
import { IPaginationOptions } from '../../types/pagination.types';
import { paginationHelpers } from '../../utils/pagination';
import { couponService } from '../coupon/coupon.service';

/**
 * Create a new order
 */
const createOrder = async (
    requestingUser: JwtPayload,
    orderData: ICreateOrderRequest,
    tenantId: string,
) => {
    //TODO: ensure floating point precision for price fields to avoid mismatch issues
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

    // Validate restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
        where: {
            id: orderData.restaurantId,
            isDeleted: false,
            tenantId: tenantId,
        },
        select: { id: true, tenantId: true },
    });
    if (!restaurant) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Restaurant not found');
    }

    // Validate tableId belongs to this restaurant/tenant
    if (orderData.tableId) {
        const table = await prisma.table.findUnique({
            where: {
                id: orderData.tableId,
                isDeleted: false,
                restaurantId: restaurant.id,
            },
            select: {
                id: true,
                restaurantId: true,
                tenantId: true,
            },
        });
        if (!table) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Table not found');
        }
    }

    // Enrich items with variantType snapshot from the selected variant
    const variantIds = orderData.items.map(item => item.variantId);
    const varinats = await prisma.variant.findMany({
        where: { id: { in: variantIds } },
        include: {
            menuProduct: true,
        },
    });
    const variantMap = new Map(varinats.map(v => [v.id, v]));
    let totalPrice = 0;
    const orderItemsToCreate: Prisma.OrderItemCreateManyOrderInput[] = [];
    for (const item of orderData.items) {
        const variant = variantMap.get(item.variantId);
        if (!variant) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                `Variant not found for variantId: ${item.variantId}`,
            );
        }
        if (
            !variant.menuProduct ||
            variant.menuProduct.restaurantId !== restaurant.id
        ) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                `Variant ${item.variantId} does not belong to the specified restaurant`,
            );
        }
        if (variant.price !== item.price) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                `Price mismatch for variant ${item.variantId}. Expected ${variant.price}, got ${item.price}`,
            );
        }
        totalPrice += item.price * item.quantity;
        //TODO: add addons
        orderItemsToCreate.push({
            name: variant.menuProduct.productTitle,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes,
            variantType: variant.type,
            menuItemId: variant.menuProductId,
            variantId: variant.id,
        });
    }

    let couponData = null;

    if (orderData.couponCode) {
        couponData = await couponService.validateCoupon(
            {
                code: orderData.couponCode,
                orderAmount: totalPrice,
                restaurantId: restaurant.id,
            },
            customerId,
        );

        totalPrice = couponData.benefit.finalAmount;
    }

    if (totalPrice != orderData.totalPrice) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Total price mismatch. Expected ${totalPrice}, got ${orderData.totalPrice}`,
        );
    }

    const createdOrder = await prisma.$transaction(async tx => {
        const createdOrder = await tx.order.create({
            data: {
                //TODO: for waiter - allow status
                status: OrderStatus.PENDING,
                totalPrice: totalPrice,
                paymentMethod: orderData.paymentMethod,
                notes: orderData.notes,
                customerId: customerId,
                restaurantId: orderData.restaurantId,
                tenantId: restaurant.tenantId,
                tableId: orderData.tableId,
                orderType: orderData.orderType,
                couponId: couponData ? couponData.coupon.id : null,
                ...(couponData
                    ? {
                          couponUsage: {
                              create: {
                                  couponId: couponData.coupon.id,
                                  customerId: customerId,
                              },
                          },
                      }
                    : {}),
                items: {
                    createMany: {
                        data: orderItemsToCreate,
                    },
                },
                lastUpdatedBy: requestingUser.id,
            },
        });

        if (orderData.couponCode) {
            await tx.coupon.update({
                where: { id: couponData?.coupon.id },
                data: {
                    usedCount: { increment: 1 },
                },
            });
        }
        return createdOrder;
    });

    return createdOrder;
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
        [OrderStatus.CANCELLED]: 0,
        [OrderStatus.PENDING]: 1,
        [OrderStatus.CONFIRMED]: 2,
        [OrderStatus.PREPARING]: 3,
        [OrderStatus.READY]: 4,
        [OrderStatus.DELIVERED]: 5,
        [OrderStatus.COMPLETED]: 6,
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

        const finalStatus =
            status === OrderStatus.DELIVERED &&
            order.paymentMethod === 'CASH'
                ? OrderStatus.COMPLETED
                : status;

        const updatedOrder = await prisma.order.update({
            where: {
                id: orderId,
                tenantId: tenantId,
            },
            data: { status: finalStatus },
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
 * Get paginated order history for the requesting customer
 */
const getCustomerOrders = async (
    requestingUser: JwtPayload,
    tenantId: string,
    filters: any,
    options: IPaginationOptions,
) => {
    const { limit, page, skip, sortBy, sortOrder } =
        paginationHelpers.calculatePagination(options);
    const { status, orderType } = filters;

    const whereConditions: Prisma.OrderWhereInput = {
        tenantId,
        isDeleted: false,
        customerId: requestingUser.id, // always scoped to the requesting user
    };

    if (status) whereConditions.status = status;
    if (orderType) whereConditions.orderType = orderType;

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where: whereConditions,
            include: { items: true },
            take: limit,
            skip,
            orderBy:
                sortBy && sortOrder
                    ? { [sortBy]: sortOrder }
                    : { createdAt: 'desc' },
        }),
        prisma.order.count({ where: whereConditions }),
    ]);

    return {
        data: orders,
        meta: {
            total,
            page,
            limit,
        },
    };
};

const getRestaurantOrders = async (
    tenantId: string,
    restaurantId: string,
    filters: any,
    options: IPaginationOptions,
) => {
    const { limit, page, skip, sortBy, sortOrder } =
        paginationHelpers.calculatePagination(options);
    const { status, orderType } = filters;
    const wheereConditions: Prisma.OrderWhereInput = {
        tenantId: tenantId,
        restaurantId: restaurantId,
    };

    if (Array.isArray(status)) wheereConditions.status = { in: status };
    else if (status) wheereConditions.status = status;
    if (orderType) wheereConditions.orderType = orderType;
    const [result, total] = await Promise.all([
        await prisma.order.findMany({
            where: wheereConditions,
            skip,
            take: limit,
            orderBy:
                sortBy && sortOrder
                    ? { [sortBy]: sortOrder }
                    : { createdAt: 'desc' },
        }),
        await prisma.order.count({ where: wheereConditions }),
    ]);

    return {
        data: result,
        meta: {
            total,
            page,
            limit,
        },
    };
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
    getCustomerOrders,
    getRestaurantOrders,
};
