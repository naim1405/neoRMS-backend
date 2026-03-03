import { z } from 'zod';
import { ReservationStatus } from '@prisma/client';

const createTableSchema = z.object({
    body: z.object({
        tableNumber: z
            .number()
            .int()
            .positive('Table number must be a positive integer'),
        capacity: z.number().int().positive().optional(),
    }),
    params: z.object({
        restaurantId: z.string().uuid('Invalid restaurant ID'),
    }),
});

const getTablesSchema = z.object({
    params: z.object({
        restaurantId: z.string().uuid('Invalid restaurant ID'),
    }),
});

const updateTableSchema = z.object({
    body: z.object({
        tableNumber: z.number().int().positive().optional(),
        capacity: z.number().int().positive().optional(),
    }),
    params: z.object({
        restaurantId: z.string().uuid('Invalid restaurant ID'),
        tableId: z.string().uuid('Invalid table ID'),
    }),
});

const deleteTableSchema = z.object({
    params: z.object({
        restaurantId: z.string().uuid('Invalid restaurant ID'),
        tableId: z.string().uuid('Invalid table ID'),
    }),
});

const createReservationSchema = z.object({
    body: z.object({
        scheduledFor: z.coerce.date('Invalid scheduled date'),
        duration: z.number().int().positive().default(60),
        partySize: z.number().int().positive('Party size must be positive'),
        notes: z.string().optional(),
        contactPhone: z.string().optional(),
    }),
    params: z.object({
        tableId: z.string().uuid('Invalid table ID'),
    }),
});

const updateReservationStatusSchema = z.object({
    body: z.object({
        status: z.enum([
            ReservationStatus.PENDING,
            ReservationStatus.CONFIRMED,
            ReservationStatus.SEATED,
            ReservationStatus.COMPLETED,
            ReservationStatus.CANCELLED,
            ReservationStatus.NO_SHOW,
        ] as [string, ...string[]]),
        scheduledFor: z.coerce.date().optional(),
        duration: z.number().int().positive().optional(),
        partySize: z.number().int().positive().optional(),
        notes: z.string().optional(),
        contactPhone: z.string().optional(),
    }),
    params: z.object({
        reservationId: z.string().uuid('Invalid reservation ID'),
    }),
});

const updateTableStateSchema = z.object({
    body: z.object({
        status: z
            .enum([
                ReservationStatus.PENDING,
                ReservationStatus.CONFIRMED,
                ReservationStatus.SEATED,
                ReservationStatus.COMPLETED,
                ReservationStatus.CANCELLED,
                ReservationStatus.NO_SHOW,
            ] as [string, ...string[]])
            .optional(),
    }),
    params: z.object({
        reservationId: z.string().uuid('Invalid reservation ID'),
    }),
});

export const tableValidator = {
    createTableSchema,
    getTablesSchema,
    updateTableSchema,
    deleteTableSchema,
    createReservationSchema,
    updateReservationStatusSchema,
    updateTableStateSchema,
};
