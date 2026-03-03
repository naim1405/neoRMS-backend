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
        status: z.nativeEnum(ProductStatus),
        priceCurrency: z.nativeEnum(Currency),
        category: z.nativeEnum(Category),
        dietaryTags: z.array(z.nativeEnum(DietaryTag)).optional(),
        images: z.array(z.string()).optional(),
        variants: z
            .array(
                z.object({
                    type: z.nativeEnum(VariantType),
                    price: z.number().int().positive('Price must be positive'),
                    discount: z.number().int().min(0).max(100).optional(),
                }),
            )
            .optional(),
        addons: z
            .array(
                z.object({
                    name: z.string().min(1, 'Addon name is required'),
                    price: z.number().int().positive('Addon price must be positive'),
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
        status: z.nativeEnum(ProductStatus).optional(),
        priceCurrency: z.nativeEnum(Currency).optional(),
        category: z.nativeEnum(Category).optional(),
        dietaryTags: z.array(z.nativeEnum(DietaryTag)).optional(),
        images: z.array(z.string()).optional(),
    }),
});

export const menuProductValidation = {
    createMenuProductSchema,
    updateMenuProductSchema,
};
