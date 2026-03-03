import { z } from 'zod';
import { IngredientUnit } from '@prisma/client';

// Either ingredientId OR (name + unit) must be provided — enforced with .refine()
const createRestaurantInventorySchema = z.object({
    body: z
        .object({
            ingredientId: z.string().optional(),
            name: z.string().min(1).optional(),
            unit: z.enum(IngredientUnit).optional(),
            availableQuantity: z
                .number()
                .min(0, 'Available quantity must be >= 0'),
            thresholdQuantity: z.number().min(0).optional(),
        })
        .refine(
            data =>
                data.ingredientId !== undefined ||
                (data.name !== undefined && data.unit !== undefined),
            {
                message:
                    'Provide either ingredientId, or both name and unit for a new ingredient',
            },
        ),
});

const updateRestaurantInventorySchema = z.object({
    body: z.object({
        availableQuantity: z.number().min(0).optional(),
        thresholdQuantity: z.number().min(0).optional(),
    }),
});

const adjustQuantitySchema = z.object({
    body: z.object({
        amount: z.number().positive('Amount must be a positive number'),
    }),
});

export const inventoryValidation = {
    createRestaurantInventorySchema,
    updateRestaurantInventorySchema,
    adjustQuantitySchema,
};
