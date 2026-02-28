import { Server } from 'socket.io';
import { verifyJwtSocket } from '../middlewares/auth.middleware';
import { verifyTenantAccessSocket } from '../middlewares/tenant.middleware';
import { UserRole } from '@prisma/client';
import { SOCKET_NAMESPACES } from './socket.types';

export const setupChefSocketNamespace = (io: Server) => {
    const chefSocket = io.of(SOCKET_NAMESPACES.CHEF);
    // Apply the JWT verification middleware to the chef namespace
    chefSocket.use(verifyJwtSocket(UserRole.CHEF));
    chefSocket.use(verifyTenantAccessSocket);
    //
    chefSocket.on('connection', async socket => {
        console.log(
            'Chef Socket connected:',
            socket.id,
            'user:',
            socket.user?.id,
        );
        const room = socket.data.tenantId;
        socket.join(room); // Join a room based on the tenant ID for targeted messaging
        socket.emit('connected', {
            message: 'Welcome to the chef socket namespace!',
        });
        //test
        socket.on('test', async data => {
            console.log('Received test event with data:', data);
            chefSocket.to(room).emit('testResponse', {
                message: 'Test event received successfully!',
                receivedData: data,
            });
        });
    });
};
