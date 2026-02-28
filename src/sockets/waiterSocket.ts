import { Server } from 'socket.io';
import { verifyJwtSocket } from '../middlewares/auth.middleware';
import { verifyTenantAccessSocket } from '../middlewares/tenant.middleware';
import { UserRole } from '@prisma/client';
import { SOCKET_NAMESPACES } from './socket.types';

export const setupWaiterSocketNamespace = (io: Server) => {
    const waiterSocket = io.of(SOCKET_NAMESPACES.WAITER);
    // Apply the JWT verification middleware to the waiter namespace
    waiterSocket.use(verifyJwtSocket(UserRole.WAITER));
    waiterSocket.use(verifyTenantAccessSocket);
    //
    waiterSocket.on('connection', async socket => {
        console.log(
            'Waiter Socket connected:',
            socket.id,
            'user:',
            socket.user?.id,
        );
        const room = socket.data.tenantId;
        socket.join(room); // Join a room based on the tenant ID for targeted messaging
        socket.emit('connected', {
            message: 'Welcome to the waiter socket namespace!',
        });
        //test
        socket.on('test', async data => {
            console.log('Received test event with data:', data);
            waiterSocket.to(room).emit('testResponse', {
                message: 'Test event received successfully!',
                receivedData: data,
            });
        });
    });
};
