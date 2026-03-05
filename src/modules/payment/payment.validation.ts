import { z } from 'zod';

const initPaymentSchema = z.object({
    body: z.object({
        orderId: z.string().uuid('Invalid order ID'),
    }),
});

export const paymentValidation = {
    initPaymentSchema,
};
