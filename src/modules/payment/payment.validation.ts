import { z } from 'zod';

const initPaymentSchema = z.object({
    body: z.object({
        orderId: z.string().min(1, 'Invalid order ID'),
    }),
});

export const paymentValidation = {
    initPaymentSchema,
};
