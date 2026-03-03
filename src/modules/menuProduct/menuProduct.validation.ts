import { z } from 'zod';
import {
    Category,
    Currency,
    DietaryTag,
    ProductStatus,
    VariantType,
} from '@prisma/client';

const createMenuProductSchema = z.object({
    body: z.object({
        productTitle: z.string().min(1, 'Product title is required'),
        productDescription: z.string().optional(),
        estimatedCookingTime: z.number().int().positive().optional(),
        status: z.enum(ProductStatus),
        priceCurrency: z.enum(Currency),
        category: z.enum(Category),
        dietaryTags: z.array(z.enum(DietaryTag)).optional(),
        images: z.array(z.string()).optional(),
        variants: z
            .array(
                z.object({
                    type: z.enum(VariantType),
                    price: z.number().int().positive('Price must be positive'),
                    discount: z.number().int().min(0).max(100).optional(),
                }),
            )
            .optional(),
        addons: z
            .array(
                z.object({
                    name: z.string().min(1, 'Addon name is required'),
                    price: z
                        .number()
                        .int()
                        .positive('Addon price must be positive'),
                }),
            )
            .optional(),
    }),
});

const updateMenuProductSchema = z.object({
    body: z.object({
        productTitle: z.string().min(1).optional(),
        productDescription: z.string().optional(),
        estimatedCookingTime: z.number().int().positive().optional(),
        status: z.enum(ProductStatus).optional(),
        priceCurrency: z.enum(Currency).optional(),
        category: z.enum(Category).optional(),
        dietaryTags: z.array(z.enum(DietaryTag)).optional(),
        images: z.array(z.string()).optional(),
    }),
});

export const menuProductValidation = {
    createMenuProductSchema,
    updateMenuProductSchema,
};
