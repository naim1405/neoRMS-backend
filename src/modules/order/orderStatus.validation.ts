import { z } from 'zod';

// Get single order by ID
const getOrderByIdSchema = z.object({
    params: z.object({
        orderId: z.string().uuid('Invalid order ID'),
    }),
});

// Get all user orders with pagination and filtering : Order History
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
        orderType: z.enum(['DINE_IN','TAKEAWAY']).optional(),
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
        orderType: z.enum(['DINE_IN','TAKEAWAY']).optional(),
        paymentMethod: z.string().optional(),
        paymentStatus: z.string().optional(),
        notes: z.string().optional(),
        estimatedDeliveryTimeInMinutes: z.number().int().positive().optional(),
    }).refine(
        (data) => Object.values(data).some(val => val !== undefined),
        'At least one field must be provided for update'
    ),
});

// Create order
const createOrderSchema = z.object({
    body: z.object({
        items: z.array(
            z.object({
                menuItemId: z.string().uuid('Invalid menu item ID'),
                name: z.string().min(1, 'Item name is required'),
                quantity: z.number().int().positive('Quantity must be positive'),
                price: z.number().positive('Price must be positive'),
                notes: z.string().optional(),
            })
        ).min(1, 'At least one item is required'),
        totalPrice: z.number().positive('Total price must be positive'),
        orderType: z.enum(['DINE_IN','TAKEAWAY']),
        paymentMethod: z.string().optional(),
        notes: z.string().optional(),
        estimatedDeliveryTimeInMinutes: z.number().int().positive().optional(),
    }),
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
        limit: z.string().optional().refine(
            (val) => !val || /^\d+$/.test(val),
            'Limit must be a number'
        ),
        page: z.string().optional().refine(
            (val) => !val || /^\d+$/.test(val),
            'Page must be a number'
        ),
        orderType: z.enum(['DINE_IN','TAKEAWAY']).optional(),
    }),
});

export const orderStatusValidation = {
    getOrderByIdSchema,
    getUserOrdersSchema,
    trackOrderSchema,
    deleteOrderSchema,
    updateOrderSchema,
    createOrderSchema,
    getOrderByStatusAndOrderTypeSchema,
};
