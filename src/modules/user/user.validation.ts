import { z } from 'zod';

const signupSchema = z.object({
    body: z.object({
        email: z.email('Invalid email address'),
        fullName: z.string().min(1, 'Full name is required'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        avatar: z.string().optional(),
        role: z.enum(['CUSTOMER', 'OWNER'], {
            message: 'Role must be either CUSTOMER or OWNER',
        }),
    }),
});

const createStaffSchema = z.object({
    body: z.object({
        email: z.email({ message: 'Invalid email address' }),
        fullName: z.string().min(1, 'Full name is required'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        avatar: z.string().optional(),
        restaurantId: z.string('Invalid restaurant ID'),
    }),
});

const updateUserSchema = z.object({
    body: z.object({
        fullName: z.string().min(1, 'Full name cannot be empty').optional(),
        avatar: z.string().optional(),
    }),
});

export const userValidation = {
    signupSchema,
    createStaffSchema,
    updateUserSchema,
};
