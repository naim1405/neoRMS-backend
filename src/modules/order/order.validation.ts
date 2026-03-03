import { OrderStatus, OrderType, PaymentMethod } from '@prisma/client';
import { z } from 'zod';

// Create order
const createOrderSchema = z.object({
    body: z
        .object({
            customerId: z.string('Invalid customer ID').optional(), // derived from JWT for CUSTOMER role; required for staff
            restaurantId: z.string('Invalid restaurant ID'),
            orderType: z.enum(OrderType),
            paymentMethod: z.enum(PaymentMethod),
            totalPrice: z
                .number()
                .int()
                .positive('Total price must be positive'),
            notes: z.string().optional(),
            tableId: z.string('Invalid table ID').optional(),
            couponCode: z.string().optional(),
            items: z
                .array(
                    z.object({
                        menuItemId: z.string('Invalid menu item ID'),
                        variantId: z.string(),
                        quantity: z
                            .number()
                            .int()
                            .positive('Quantity must be positive'),
                        price: z
                            .number()
                            .int()
                            .positive('Price must be positive'),
                        notes: z.string().optional(),
                    }),
                )
                .min(1, 'At least one item is required'),
        })
        .superRefine((data, ctx) => {
            if (data.orderType === 'DINE_IN' && !data.tableId) {
                ctx.addIssue({
                    code: 'custom',
                    message: 'tableId is required for DINE_IN orders',
                    path: ['tableId'],
                });
            }
        }),
});

// Get single order by ID
const getOrderByIdSchema = z.object({
    params: z.object({
        orderId: z.string('Invalid order ID'),
    }),
});

// Get all customer orders with pagination and filtering : Order History
const getCustomerOrdersSchema = z.object({
    query: z.object({
        limit: z
            .string()
            .optional()
            .refine(val => !val || /^\d+$/.test(val), 'Limit must be a number'),
        page: z
            .string()
            .optional()
            .refine(val => !val || /^\d+$/.test(val), 'Page must be a number'),
        status: z.enum(OrderStatus).optional(),
        orderType: z.enum(OrderType).optional(),
    }),
});

// Track order status in real-time
const trackOrderSchema = z.object({
    params: z.object({
        orderId: z.string('Invalid order ID'),
    }),
});

// Delete order
const deleteOrderSchema = z.object({
    params: z.object({
        orderId: z.string('Invalid order ID'),
    }),
});

// Update order status
const updateOrderStatusSchema = z.object({
    params: z.object({
        orderId: z.string('Invalid order ID'),
    }),
    body: z.object({
        status: z.enum(OrderStatus),
    }),
});
// update order details
const updateOrderSchema = z.object({
    params: z.object({
        orderId: z.string('Invalid order ID'),
    }),
    body: z
        .object({
            orderType: z.enum(OrderType).optional(),
            paymentMethod: z.enum(PaymentMethod).optional(),
            notes: z.string().optional(),
            estimatedDeliveryTimeInMinutes: z
                .number()
                .int()
                .positive()
                .optional(),
            items: z
                .array(
                    z.object({
                        menuItemId: z.string('Invalid menu item ID'),
                        name: z.string().min(1, 'Item name is required'),
                        quantity: z
                            .number()
                            .int()
                            .positive('Quantity must be positive'),
                        price: z
                            .number()
                            .int()
                            .positive('Price must be positive'),
                        notes: z.string().optional(),
                        variantId: z.string().optional(),
                    }),
                )
                .min(1, 'At least one item is required if items are provided')
                .optional(),
        })
        .refine(
            data => Object.values(data).some(val => val !== undefined),
            'At least one field must be provided for update',
        ),
});

export const orderStatusValidation = {
    getOrderByIdSchema,
    getCustomerOrdersSchema,
    trackOrderSchema,
    deleteOrderSchema,
    updateOrderStatusSchema,
    updateOrderSchema,
    createOrderSchema,
};
