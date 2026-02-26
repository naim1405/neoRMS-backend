import { Server } from 'socket.io';
import cookie from 'cookie';
import ApiError from '../utils/ApiError';
import httpstatus from 'http-status';
import prisma from '../utils/prisma';
import { AuthUtils } from '../utils/AuthUtils';
import { ChatEventEnum } from '../constants';
import { Socket } from './socket.types';
import { verifyJwt } from '../middlewares/socket.middleware';
import { UserRole } from '@prisma/client';
import { SOCKET_NAMESPACES } from '.';

export const setupCustomerSocketNamespace = (io: Server) => {
    const customerSocket = io.of(SOCKET_NAMESPACES.CUSTOMER);
    // Apply the JWT verification middleware to the customer namespace
    //customerSocket.use(verifyJwt(UserRole.CUSTOMER));
    //
    customerSocket.on('connection', (socket: Socket) => {
        const room = '123';
        console.log(
            'Customer Socket connected:',
            socket.id,
            'user:',
            socket.user?.id,
        );
        socket.join(room); // Join a room based on the user ID for targeted messaging
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
