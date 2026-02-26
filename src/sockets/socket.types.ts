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
