import { z } from 'zod';


const getOrderByIdSchema = z.object({
    params: z.object({
        orderId: z.string().uuid('Invalid order ID'),
    }),
});


const getUserOrdersSchema = z.object({          //  with filters
    query: z.object({
        limit: z.string().optional(),
        page: z.string().optional(),
        status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']).optional(),
    }),
});


const trackOrderSchema = z.object({           // with (real-time status)
    params: z.object({
        orderId: z.string().uuid('Invalid order ID'),
    }),
});

export const orderStatusValidation = {
    getOrderByIdSchema,
    getUserOrdersSchema,
    trackOrderSchema,
};
