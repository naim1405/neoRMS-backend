import { z } from 'zod';

const loginSchema = z.object({
    body: z.object({
        email: z.string(),
        password: z.string(),
    }),
});

const registerSchema = z.object({
    body: z.object({
        email: z.string(),
        fullName: z.string(),
        avatar: z.string().optional(),
        password: z.string(),
    }),
});

const emailVerificationSchema = z.object({
    body: z.object({
        otp: z.number(),
    }),
});

export const authValidation = {
    loginSchema,
    registerSchema,
    emailVerificationSchema,
};
