import { Socket as BaseSocket } from 'socket.io';
import { User } from '@prisma/client';

// Only include the fields needed in the socket
export type SocketUser = Pick<
    User,
    'id' | 'email' | 'fullName' | 'avatar' | 'isVerified' | 'role'
>;

export interface Socket extends BaseSocket {
    user?: SocketUser;
}
