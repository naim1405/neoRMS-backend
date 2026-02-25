import { OrderStatus } from '@prisma/client';

// OrderItem Interface
export interface IOrderItem {
    id: string;
    orderId: string;
    menuItemId: string;
    name: string;
    quantity: number;
    price: number;
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// Full Order Interface
export interface IOrder {
    id: string;
    userId: string;
    status: OrderStatus;
    items: IOrderItem[];
    totalPrice: number;
    paymentMethod?: string | null;
    paymentStatus?: string | null;
    notes?: string | null;
    estimatedDeliveryTime?: number | null;
    deliveryAddress?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// Create Order Request Body
export interface ICreateOrderRequest {
    items: Array<{
        menuItemId: string;
        name: string;
        quantity: number;
        price: number;
        notes?: string;
    }>;
    totalPrice: number;
    paymentMethod?: string;
    notes?: string;
    estimatedDeliveryTime?: number;
    deliveryAddress?: string;
}

// Update Order Request Body
export interface IUpdateOrderRequest {
    status?: OrderStatus;
    paymentMethod?: string;
    paymentStatus?: string;
    notes?: string;
    estimatedDeliveryTime?: number;
    deliveryAddress?: string;
}

// Get Order By ID Params
export interface IGetOrderByIdParams {
    orderId: string;
}

// Get User Orders Query
export interface IGetUserOrdersQuery {
    limit?: number;
    page?: number;
    status?: OrderStatus;
}

// Order Stats Response
export interface IOrderStats {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
}
