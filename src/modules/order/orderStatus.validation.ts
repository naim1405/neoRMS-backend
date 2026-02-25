import { z } from 'zod';

// Get single order by ID
const getOrderByIdSchema = z.object({
    params: z.object({
        orderId: z.string().uuid('Invalid order ID'),
    }),
});

// Get all user orders with pagination and filtering
const getUserOrdersSchema = z.object({
    query: z.object({
        limit: z.string().optional().refine(
            (val) => !val || /^\d+$/.test(val),
            'Limit must be a number'
        ),
        page: z.string().optional().refine(
            (val) => !val || /^\d+$/.test(val),
            'Page must be a number'
        ),
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

// Update order
const updateOrderSchema = z.object({
    params: z.object({
        orderId: z.string().uuid('Invalid order ID'),
    }),
    body: z.object({
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
        paymentMethod: z.string().optional(),
        paymentStatus: z.string().optional(),
        notes: z.string().optional(),
        estimatedDeliveryTime: z.number().int().positive().optional(),
        deliveryAddress: z.string().optional(),
    }).refine(
        (data) => Object.values(data).some(val => val !== undefined),
        'At least one field must be provided for update'
    ),
});

export const orderStatusValidation = {
    getOrderByIdSchema,
    getUserOrdersSchema,
    trackOrderSchema,
    deleteOrderSchema,
    updateOrderSchema,
};
