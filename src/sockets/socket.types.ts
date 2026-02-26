import { User } from '@prisma/client';
import type { Socket as IoSocket } from 'socket.io';
import 'socket.io';

// Only include the fields needed in the socket
export type SocketUser = Pick<
    User,
    'id' | 'email' | 'fullName' | 'isVerified' | 'role'
>;

declare module 'socket.io' {
    interface Socket {
        user: SocketUser;
    }

    interface SocketData {
        restaurantId?: string;
    }
}

export type Socket = IoSocket;

export enum SOCKET_NAMESPACES {
    WAITER = '/waiter',
    CHEF = '/chef',
    CUSTOMER = '/customer',
}

export enum WaiterSocketEventEnum {
    // once user is ready to go
    CONNECTED_EVENT = 'connected',
    // when user gets disconnected
    DISCONNECT_EVENT = 'disconnect',
    // when there is an error in socket
    SOCKET_ERROR_EVENT = 'socketError',
    // when user places an order
    ORDER_PLACED_EVENT = 'orderPlaced',
    // when user cancels an order
    ORDER_CANCELLED_EVENT = 'orderCancelled',
    // when user updates an order
    ORDER_UPDATED_EVENT = 'orderUpdated',
    // when order is ready
    ORDER_READY_EVENT = 'orderReady',
    // when order is cancelled by chef
    ORDER_CANCELLED_BY_CHEF_EVENT = 'orderCancelledByChef',
}

export enum ChefSocketEventEnum {
    // once user is ready to go
    CONNECTED_EVENT = 'connected',
    // when user gets disconnected
    DISCONNECT_EVENT = 'disconnect',
    // when there is an error in socket
    SOCKET_ERROR_EVENT = 'socketError',
    // when user places an order
    ORDER_PLACED_EVENT = 'orderPlaced',
    // when order is in progress
    ORDER_IN_PROGRESS_EVENT = 'orderInProgress',
    // when user cancels an order
    ORDER_CANCELLED_EVENT = 'orderCancelled',
}
export enum CustomerSocketEventEnum {
    // once user is ready to go
    CONNECTED_EVENT = 'connected',
    // when user gets disconnected
    DISCONNECT_EVENT = 'disconnect',
    // when there is an error in socket
    SOCKET_ERROR_EVENT = 'socketError',
    // when order status is updated
    ORDER_STATUS_UPDATED_EVENT = 'orderStatusUpdated',
}
