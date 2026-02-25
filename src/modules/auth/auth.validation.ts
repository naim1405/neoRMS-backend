import { z } from 'zod';

const loginSchema = z.object({
    body: z.object({
        email: z.string(),
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
    emailVerificationSchema,
};
