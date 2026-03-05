import { Server } from 'socket.io';
import { verifyJwtSocket } from '../middlewares/auth.middleware';
import { verifyTenantAccessSocket } from '../middlewares/tenant.middleware';
import { UserRole } from '@prisma/client';
import { SOCKET_NAMESPACES } from './socket.types';

export const setupCustomerSocketNamespace = (io: Server) => {
    const customerSocket = io.of(SOCKET_NAMESPACES.CUSTOMER);
    // Apply the JWT verification middleware to the customer namespace
    customerSocket.use(verifyJwtSocket(UserRole.CUSTOMER));
    customerSocket.use(verifyTenantAccessSocket);
    //
    customerSocket.on('connection', async socket => {
        console.log(
            'Customer Socket connected:',
            socket.id,
            'user:',
            socket.user?.id,
        );
        const room = socket.user.id;
        socket.join(room); // Join a room based on the customer ID for targeted messaging
        socket.emit('connected', {
            message: 'Welcome to the customer socket namespace!',
        });
        //test
        socket.on('test', async data => {
            console.log('Received test event with data:', data);
            customerSocket.to(room).emit('testResponse', {
                message: 'Test event received successfully!',
                receivedData: data,
            });
        });
    });
};
