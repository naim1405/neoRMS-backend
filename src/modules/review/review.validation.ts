import { z } from 'zod';

const createReviewSchema = z.object({
    body: z.object({
        menuProductId: z.uuid('Invalid menu product ID'),
        orderId: z.uuid('Invalid order ID'),
        rating: z
            .number()
            .min(1, 'Rating must be at least 1')
            .max(5, 'Rating cannot be more than 5'),
        comment: z.string().trim().max(1000).optional(),
    }),
});

const getMyReviewsSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().optional(),
    }),
});

const getReviewByOrderSchema = z.object({
    params: z.object({
        orderId: z.uuid('Invalid order ID'),
    }),
});

const getReviewByMenuProductSchema = z.object({
    params: z.object({
        menuProductId: z.uuid('Invalid menu product ID'),
    }),
});

const managementGetAllReviewsSchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().optional(),
        rating: z.coerce.number().min(1).max(5).optional(),
        customerId: z.uuid('Invalid customer ID').optional(),
        menuProductId: z.uuid('Invalid menu product ID').optional(),
        orderId: z.uuid('Invalid order ID').optional(),
    }),
});

const managementGetByCustomerSchema = z.object({
    params: z.object({
        customerId: z.uuid('Invalid customer ID'),
    }),
    query: z.object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().optional(),
    }),
});

const managementGetByMenuProductSchema = z.object({
    params: z.object({
        menuProductId: z.uuid('Invalid menu product ID'),
    }),
    query: z.object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().optional(),
    }),
});

const managementGetByOrderSchema = z.object({
    params: z.object({
        orderId: z.uuid('Invalid order ID'),
    }),
});

const managementGetSingleReviewSchema = z.object({
    params: z.object({
        reviewId: z.uuid('Invalid review ID'),
    }),
});

const managementDeleteReviewSchema = z.object({
    params: z.object({
        reviewId: z.uuid('Invalid review ID'),
    }),
});

export const reviewValidation = {
    createReviewSchema,
    getMyReviewsSchema,
    getReviewByOrderSchema,
    getReviewByMenuProductSchema,
    managementGetAllReviewsSchema,
    managementGetByCustomerSchema,
    managementGetByMenuProductSchema,
    managementGetByOrderSchema,
    managementGetSingleReviewSchema,
    managementDeleteReviewSchema,
};
