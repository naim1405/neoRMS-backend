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

export const setupWaiterSocketNamespace = (io: Server) => {
    const waiterSocket = io.of(SOCKET_NAMESPACES.WAITER);
    // Apply the JWT verification middleware to the waiter namespace
    // waiterSocket.use(verifyJwt(UserRole.WAITER));
    //
    waiterSocket.on('connection', (socket: Socket) => {
        const room = '123';
        console.log(
            'Waiter Socket connected:',
            socket.id,
            'user:',
            socket.user?.id,
        );
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
