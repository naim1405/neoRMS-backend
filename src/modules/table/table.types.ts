import { ReservationStatus } from '@prisma/client';

export interface ICreateTable {
    tableNumber: number;
    capacity?: number;
}

export interface IUpdateTable {
    tableNumber?: number;
    capacity?: number;
}

export interface ICreateReservation {
    scheduledFor: string | Date; // time when scheduled time starts
    duration?: number;
    partySize: number;
    notes?: string;
    contactPhone?: string;
}

export interface IUpdateReservation {
    status?: ReservationStatus;
    scheduledFor?: string | Date;
    duration?: number;
    partySize?: number;
    notes?: string;
    contactPhone?: string;
}

export interface IupdateReservationStatus {
    status?: string;
}
