import { z } from 'zod';

// Common date-range query used across all analytics routes
const dateRangeQuerySchema = z.object({
    query: z.object({
        startDate: z
            .string()
            .datetime({ message: 'startDate must be a valid ISO 8601 datetime' })
            .optional(),
        endDate: z
            .string()
            .datetime({ message: 'endDate must be a valid ISO 8601 datetime' })
            .optional(),
    }),
});

// /analytics/dashboard/:restaurantId
const dashboardSchema = dateRangeQuerySchema;

// /analytics/orders/:restaurantId
const ordersSchema = dateRangeQuerySchema;

// /analytics/menu/:restaurantId
const menuSchema = dateRangeQuerySchema;

// /analytics/inventory/:restaurantId  — no extra query params beyond date range
const inventorySchema = dateRangeQuerySchema;

// /analytics/restaurants — owner-level, optional date range
const restaurantsSchema = dateRangeQuerySchema;

// /analytics — summary, optional date range
const summarySchema = dateRangeQuerySchema;

export const analyticsValidation = {
    dashboardSchema,
    ordersSchema,
    menuSchema,
    inventorySchema,
    restaurantsSchema,
    summarySchema,
};
