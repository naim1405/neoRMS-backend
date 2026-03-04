import ApiError from '../../utils/ApiError';
import httpstatus from 'http-status';
import prisma from '../../utils/prisma';
import {
    ICreateTable,
    IUpdateTable,
    ICreateReservation,
    IUpdateReservation,
} from './table.types';
import { JwtPayload } from '../../types/jwt.types';
import { ReservationStatus } from '@prisma/client';

const getTablesByRestaurantID = async (restaurantId: string) => {
    const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
    });

    if (!restaurant) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Restaurant not found');
    }

    const tables = await prisma.table.findMany({
        where: { restaurantId, isDeleted: false },
        include: {
            reservations: {
                where: {
                    isDeleted: false,
                    status: {
                        in: [
                            ReservationStatus.PENDING,
                            ReservationStatus.CONFIRMED,
                            ReservationStatus.SEATED,
                        ],
                    },
                },
            },
            orders: {
                where: {
                    isDeleted: false,
                },
            },
        },
        orderBy: { tableNumber: 'asc' },
    });

    return tables;
};

const createTable = async (
    payload: ICreateTable,
    restaurantId: string,
    tenantId: string,
) => {
    // Check if restaurant exists and belongs to tenant
    const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId, tenantId },
    });

    if (!restaurant) {
        throw new ApiError(
            httpstatus.NOT_FOUND,
            'Restaurant not found or does not belong to your tenant',
        );
    }

    // Check for duplicate table number
    const existingTable = await prisma.table.findUnique({
        where: {
            restaurantId_tableNumber: {
                restaurantId,
                tableNumber: payload.tableNumber,
            },
        },
    });

    if (existingTable) {
        throw new ApiError(
            httpstatus.BAD_REQUEST,
            'Table with this number already exists for this restaurant',
        );
    }

    const table = await prisma.table.create({
        data: {
            tableNumber: payload.tableNumber,
            capacity: payload.capacity,
            restaurantId,
            tenantId,
        },
    });

    return table;
};

const updateTable = async (
    tableId: string,
    restaurantId: string,
    tenantId: string,
    payload: IUpdateTable,
) => {
    const table = await prisma.table.findUnique({
        where: { id: tableId, restaurantId, tenantId },
    });

    if (!table) {
        throw new ApiError(
            httpstatus.NOT_FOUND,
            'Table not found or does not belong to your restaurant',
        );
    }

    // If updating table number, check for duplicates
    if (payload.tableNumber && payload.tableNumber !== table.tableNumber) {
        const existingTable = await prisma.table.findUnique({
            where: {
                restaurantId_tableNumber: {
                    restaurantId,
                    tableNumber: payload.tableNumber,
                },
            },
        });

        if (existingTable) {
            throw new ApiError(
                httpstatus.BAD_REQUEST,
                'Table with this number already exists for this restaurant',
            );
        }
    }

    const updated = await prisma.table.update({
        where: { id: tableId },
        data: payload,
    });

    return updated;
};

const softDeleteTable = async (
    requestingUser: JwtPayload,
    tableId: string,
    restaurantId: string,
    tenantId: string,
) => {
    const table = await prisma.table.findUnique({
        where: { id: tableId, restaurantId, tenantId },
    });

    if (!table) {
        throw new ApiError(
            httpstatus.NOT_FOUND,
            'Table not found or does not belong to your restaurant',
        );
    }

    // Soft delete
    const deleted = await prisma.table.update({
        where: { id: tableId },
        data: {
            isDeleted: true,
            deletedBy: requestingUser.id,
        },
    });

    return deleted;
};

const hardDeleteTable = async (
    tableId: string,
    restaurantId: string,
    tenantId: string,
) => {
    const table = await prisma.table.findUnique({
        where: { id: tableId, restaurantId, tenantId },
    });

    if (!table) {
        throw new ApiError(
            httpstatus.NOT_FOUND,
            'Table not found or does not belong to your restaurant',
        );
    }

    // Hard delete
    await prisma.table.delete({
        where: { id: tableId },
    });
    return { id: tableId };
};

const createReservation = async (
    payload: ICreateReservation,
    tableId: string,
    customerId: string,
    tenantId: string,
) => {
    // Verify table exists
    const table = await prisma.table.findUnique({
        where: { id: tableId, tenantId, isDeleted: false },
    });

    if (!table) {
        throw new ApiError(
            httpstatus.NOT_FOUND,
            'Table not found or is deleted',
        );
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
        where: { userId: customerId },
    });

    if (!customer) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Customer not found');
    }

    // Check for conflicting reservations
    const scheduledFromDate = new Date(payload.scheduledFor);
    const scheduledToDate = new Date(
        scheduledFromDate.getTime() + (payload.duration || 60) * 60000,
    );

    const conflictingReservation = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Reservation"
    WHERE "tableId" = ${tableId}
      AND "isDeleted" = false
      AND "status" IN ('PENDING', 'CONFIRMED', 'SEATED')
      AND "scheduledFor" < ${scheduledToDate}
      AND "scheduledFor" + ("duration" * INTERVAL '1 minute') > ${scheduledFromDate}
    LIMIT 1
`;

    if (conflictingReservation.length > 0) {
        throw new ApiError(
            httpstatus.BAD_REQUEST,
            'Table is already reserved for this time slot',
        );
    }

    // Create reservation
    const reservation = await prisma.reservation.create({
        data: {
            scheduledFor: scheduledFromDate,
            duration: payload.duration || 60,
            partySize: payload.partySize,
            notes: payload.notes,
            contactPhone: payload.contactPhone,
            customerId,
            tableId,
            restaurantId: table.restaurantId,
            tenantId,
            status: ReservationStatus.PENDING,
        },
        include: {
            table: true,
            customer: true,
            restaurant: true,
        },
    });

    // Schedule auto-completion after duration expires
    scheduleReservationCompletion(reservation.id, payload.duration || 60);

    return reservation;
};

const updateReservationDetails = async (
    reservationId: string,
    payload: IUpdateReservation,
    user: JwtPayload,
    tenantId: string,
) => {
    const reservation = await prisma.reservation.findUnique({
        where: { id: reservationId, tenantId, isDeleted: false },
        include: { table: true, customer: true },
    });

    if (!reservation) {
        throw new ApiError(
            httpstatus.NOT_FOUND,
            'Reservation not found or is deleted',
        );
    }

    // Authorization check - customer can only update their own reservation
    if (user.role === 'CUSTOMER' && reservation.customerId !== user.id) {
        throw new ApiError(
            httpstatus.FORBIDDEN,
            'You can only update your own reservations',
        );
    }

    // Authorization check - Customer can only cancel, not change to CONFIRMED or SEATED
    if (
        user.role === 'CUSTOMER' &&
        payload.status &&
        payload.status !== ReservationStatus.CANCELLED
    ) {
        throw new ApiError(
            httpstatus.FORBIDDEN,
            'Customers can not change reservation status to CONFIRMED or SEATED. Can only cancel their reservation.',
        );
    }

    // Authorization check - customer can only change the status
    if (
        user.role === 'CUSTOMER' &&
        (payload.scheduledFor || payload.duration || payload.partySize)
    ) {
        throw new ApiError(
            httpstatus.FORBIDDEN,
            'Customers can only update reservation status,Notes and contact phone, not other details.',
        );
    }

    const updated = await prisma.reservation.update({
        where: { id: reservationId },
        data: {
            ...(payload.status && {
                status: payload.status as ReservationStatus,
            }),
            ...(payload.scheduledFor && {
                scheduledFor: new Date(payload.scheduledFor),
            }),
            ...(payload.duration && { duration: payload.duration }),
            ...(payload.partySize && { partySize: payload.partySize }),
            ...(payload.notes && { notes: payload.notes }),
            ...(payload.contactPhone && { contactPhone: payload.contactPhone }),
        },
        include: {
            table: true,
            customer: true,
            restaurant: true,
        },
    });

    // If status is changing to COMPLETED, reschedule if needed
    if (payload.status === ReservationStatus.COMPLETED) {
        // Cancel any scheduled expiry for this reservation
        clearReservationSchedule(reservationId);
    }

    return updated;
};

const updateReservationStatus = async (
    reservationId: string,
    payload: { status?: string },
    tenantId: string,
) => {
    const reservation = await prisma.reservation.findUnique({
        where: { id: reservationId, tenantId, isDeleted: false },
        include: { table: true },
    });

    if (!reservation) {
        throw new ApiError(
            httpstatus.NOT_FOUND,
            'Reservation not found or is deleted',
        );
    }

    // Update reservation status (which effectively updates table state)
    const updated = await prisma.reservation.update({
        where: { id: reservationId },
        data: {
            ...(payload.status && {
                status: payload.status as ReservationStatus,
            }),
        },
        include: {
            table: true,
            customer: true,
            restaurant: true,
        },
    });

    return updated;
};

// Helper function to schedule auto-completion
const reservationSchedules = new Map<string, NodeJS.Timeout>();

function scheduleReservationCompletion(
    reservationId: string,
    durationInMinutes: number,
) {
    // Clear any existing schedule for this reservation
    if (reservationSchedules.has(reservationId)) {
        clearTimeout(reservationSchedules.get(reservationId)!);
    }

    // Schedule the completion
    const timeoutId = setTimeout(
        async () => {
            try {
                await prisma.reservation.update({
                    where: { id: reservationId },
                    data: { status: ReservationStatus.COMPLETED },
                });

                // Remove from map
                reservationSchedules.delete(reservationId);
            } catch (error) {
                console.error(
                    `Failed to auto-complete reservation ${reservationId}:`,
                    error,
                );
            }
        },
        durationInMinutes * 60 * 1000,
    );

    reservationSchedules.set(reservationId, timeoutId);
}

function clearReservationSchedule(reservationId: string) {
    if (reservationSchedules.has(reservationId)) {
        clearTimeout(reservationSchedules.get(reservationId)!);
        reservationSchedules.delete(reservationId);
    }
}

export const tableService = {
    createTable,
    getTablesByRestaurantID,
    updateTable,
    softDeleteTable,
    hardDeleteTable,
    createReservation,
    updateReservationDetails,
    updateReservationStatus,
};
