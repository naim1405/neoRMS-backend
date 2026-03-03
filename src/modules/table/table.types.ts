export interface ICreateTable {
    tableNumber: number;
    capacity?: number;
}

export interface IUpdateTable {
    tableNumber?: number;
    capacity?: number;
}

export interface ICreateReservation {
    scheduledFor: string | Date;
    duration?: number;
    partySize: number;
    notes?: string;
    contactPhone?: string;
}

export interface IUpdateReservation {
    status?: string;
    scheduledFor?: string | Date;
    duration?: number;
    partySize?: number;
    notes?: string;
    contactPhone?: string;
}

export interface IUpdateTableState {
    status?: string;
}
