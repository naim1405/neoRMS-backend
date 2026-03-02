import { z } from 'zod';

// Create order
const createOrderSchema = z.object({
    body: z
        .object({
            customerId: z.string().uuid('Invalid customer ID').optional(), // derived from JWT for CUSTOMER role; required for staff
            restaurantId: z.string().uuid('Invalid restaurant ID'),
            orderType: z.enum(['DINE_IN', 'TAKEAWAY', 'DELIVERY']),
            paymentMethod: z.enum([
                'CASH',
                'CARD',
                'MOBILE_PAYMENT',
                'ONLINE_PAYMENT',
            ]),
            totalPrice: z.number().positive('Total price must be positive'),
            notes: z.string().optional(),
            tableId: z.string().uuid('Invalid table ID').optional(),
            estimatedDeliveryTimeInMinutes: z
                .number()
                .int()
                .positive()
                .optional(),
            items: z
                .array(
                    z.object({
                        menuItemId: z.string().uuid('Invalid menu item ID'),
                        name: z.string().min(1, 'Item name is required'),
                        quantity: z
                            .number()
                            .int()
                            .positive('Quantity must be positive'),
                        price: z.number().positive('Price must be positive'),
                        notes: z.string().optional(),
                        variantId: z.string().uuid().optional(),
                    }),
                )
                .min(1, 'At least one item is required'),
        })
        .superRefine((data, ctx) => {
            if (data.orderType === 'DINE_IN' && !data.tableId) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'tableId is required for DINE_IN orders',
                    path: ['tableId'],
                });
            }
        }),
});

// Get single order by ID
const getOrderByIdSchema = z.object({
    params: z.object({
        orderId: z.string().uuid('Invalid order ID'),
    }),
});

// Get all user orders with pagination and filtering : Order History
const getUserOrdersSchema = z.object({
    query: z.object({
        limit: z
            .string()
            .optional()
            .refine(val => !val || /^\d+$/.test(val), 'Limit must be a number'),
        page: z
            .string()
            .optional()
            .refine(val => !val || /^\d+$/.test(val), 'Page must be a number'),
        status: z
            .enum([
                'PENDING',
                'CONFIRMED',
                'PREPARING',
                'READY',
                'DELIVERED',
                'CANCELLED',
            ])
            .optional(),
        orderType: z.enum(['DINE_IN', 'TAKEAWAY', 'DELIVERY']).optional(),
    }),
});

// Track order status in real-time
const trackOrderSchema = z.object({
    params: z.object({
        orderId: z.string().uuid('Invalid order ID'),
    }),
});

// Delete order
const deleteOrderSchema = z.object({
    params: z.object({
        orderId: z.string().uuid('Invalid order ID'),
    }),
});

// Update order status
const updateOrderStatusSchema = z.object({
    params: z.object({
        orderId: z.string().uuid('Invalid order ID'),
    }),
    body: z.object({
        status: z.enum([
            'PENDING',
            'CONFIRMED',
            'PREPARING',
            'READY',
            'DELIVERED',
            'CANCELLED',
        ]),
    }),
});
// update order details
const updateOrderSchema = z.object({
    params: z.object({
        orderId: z.string().uuid('Invalid order ID'),
    }),
    body: z
        .object({
            orderType: z.enum(['DINE_IN', 'TAKEAWAY', 'DELIVERY']).optional(),
            paymentMethod: z
                .enum(['CASH', 'CARD', 'MOBILE_PAYMENT', 'ONLINE_PAYMENT'])
                .optional(),
            notes: z.string().optional(),
            estimatedDeliveryTimeInMinutes: z
                .number()
                .int()
                .positive()
                .optional(),
            items: z
                .array(
                    z.object({
                        menuItemId: z.string().uuid('Invalid menu item ID'),
                        name: z.string().min(1, 'Item name is required'),
                        quantity: z
                            .number()
                            .int()
                            .positive('Quantity must be positive'),
                        price: z.number().positive('Price must be positive'),
                        notes: z.string().optional(),
                        variantId: z.string().uuid().optional(),
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

// Get order by status
const getOrderByStatusAndOrderTypeSchema = z.object({
    params: z.object({
        status: z.enum([
            'PENDING',
            'CONFIRMED',
            'PREPARING',
            'READY',
            'DELIVERED',
            'CANCELLED',
        ]),
    }),
    query: z.object({
        limit: z
            .string()
            .optional()
            .refine(val => !val || /^\d+$/.test(val), 'Limit must be a number'),
        page: z
            .string()
            .optional()
            .refine(val => !val || /^\d+$/.test(val), 'Page must be a number'),
        orderType: z.enum(['DINE_IN', 'TAKEAWAY', 'DELIVERY']).optional(),
    }),
});

export const orderStatusValidation = {
    getOrderByIdSchema,
    getUserOrdersSchema,
    trackOrderSchema,
    deleteOrderSchema,
    updateOrderStatusSchema,
    updateOrderSchema,
    createOrderSchema,
    getOrderByStatusAndOrderTypeSchema,
};
