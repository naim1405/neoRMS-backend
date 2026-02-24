// Type definitions for Order Status-related requests and responses

// NOTE: Order model needs to be added to Prisma schema
// Expected fields: id, userId, status, totalPrice, items[], createdAt, updatedAt
// Status enum should include: PENDING, CONFIRMED, PREPARING, READY, DELIVERED, CANCELLED

export enum OrderStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    PREPARING = 'PREPARING',
    READY = 'READY',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
}

export interface IOrderItem {
    menuItemId: string;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
}

export interface IOrder {
    id: string;
    userId: string;
    status: OrderStatus;
    items: IOrderItem[];
    totalPrice: number;
    paymentMethod?: string; // e.g., 'CASH', 'CARD', 'ONLINE'
    paymentStatus?: string; // PENDING, COMPLETED, FAILED
    notes?: string;
    estimatedDeliveryTime?: number; 
    deliveryAddress?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IGetOrderByIdParams {
    orderId: string;
}

export interface IGetUserOrdersQuery {
    limit?: number;
    page?: number;
    status?: OrderStatus;
}
