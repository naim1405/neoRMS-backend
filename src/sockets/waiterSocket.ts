import { Server } from 'socket.io';
import {
    ensureAssociatedRestaurant,
    verifyJwt,
} from '../middlewares/socket.middleware';
import { UserRole } from '@prisma/client';
import { SOCKET_NAMESPACES } from '.';

export const setupWaiterSocketNamespace = (io: Server) => {
    const waiterSocket = io.of(SOCKET_NAMESPACES.WAITER);
    // Apply the JWT verification middleware to the waiter namespace
    waiterSocket.use(verifyJwt(UserRole.WAITER));
    waiterSocket.use(ensureAssociatedRestaurant);
    //
    waiterSocket.on('connection', async socket => {
        console.log(
            'Waiter Socket connected:',
            socket.id,
            'user:',
            socket.user?.id,
        );
        const room = socket.data.restaurantId;
        console.log('🚀 const : ', 'hi?');
        socket.join(room); // Join a room based on the user ID for targeted messaging
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
