import { z } from 'zod';

const createRestaurantSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Restaurant name is required'),
        tagline: z.string().optional(),
        description: z.string().optional(),
        location: z.string().optional(),
        contactInfo: z.string().optional(),
        bannerImage: z.string().optional(),
    }),
});

const updateRestaurantSchema = z.object({
    body: z.object({
        name: z.string().optional(),
        tagline: z.string().optional(),
        description: z.string().optional(),
        location: z.string().optional(),
        contactInfo: z.string().optional(),
        bannerImage: z.string().optional(),
    }),
});

export const restaurantValidation = {
    createRestaurantSchema,
    updateRestaurantSchema,
};
