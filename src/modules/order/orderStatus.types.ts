import {
    OrderStatus,
    OrderType,
    PaymentMethod,
    PaymentStatus,
    VariantType,
} from '@prisma/client';

// OrderItem Interface
export interface IOrderItem {
    id: string;
    orderId: string;
    menuItemId: string;
    name: string;
    quantity: number;
    price: number;
    variantId?: string;
    variantType?: VariantType | null;
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// Full Order Interface
export interface IOrder {
    id: string;
    customerId: string;
    restaurantId: string;
    tenantId: string;
    status: OrderStatus;
    orderType: OrderType;
    items: IOrderItem[];
    totalPrice: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    tableId?: string | null;
    couponId?: string | null;
    notes?: string | null;
    estimatedDeliveryTimeInMinutes?: number | null;
    createdAt: Date;
    updatedAt: Date;
}

// Create Order Request Body
export interface ICreateOrderRequest {
    restaurantId: string;
    items: Array<{
        menuItemId: string;
        name: string;
        quantity: number;
        price: number;
        variantId?: string;
        notes?: string;
    }>;
    totalPrice: number;
    paymentMethod: 'CASH' | 'CARD' | 'MOBILE_PAYMENT' | 'ONLINE_PAYMENT';
    notes?: string;
    estimatedDeliveryTimeInMinutes?: number;
    tableId?: string; // optional, for DINE_IN
}

// Update Order Request Body
export interface IUpdateOrderRequest {
    orderType?: OrderType;
    paymentMethod?: PaymentMethod;
    notes?: string;
    estimatedDeliveryTimeInMinutes?: number;
    items?: {
        menuItemId: string;
        name: string;
        quantity: number;
        price: number;
        variantId?: string;
        notes?: string;
    }[];
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
    confirmedOrders: number;
    preparingOrders: number;
    readyOrders: number;
}
