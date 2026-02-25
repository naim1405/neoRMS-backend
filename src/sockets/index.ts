import { Server } from 'socket.io';
import cookie from 'cookie';
import ApiError from '../utils/ApiError';
import httpstatus from 'http-status';
import prisma from '../utils/prisma';
import { AuthUtils } from '../utils/AuthUtils';
import { ChatEventEnum } from '../constants';
import { Request } from 'express';
import { Socket } from './socket.types';
import { setupWaiterSocketNamespace } from './waiterSocket';

// const initializeScoketIO = (io: Server) => {
//     return io.on('connection', async (socket: Socket) => {
//         try {
//             console.log('Chat connected:', socket.id);
//             let token = socket.handshake.auth?.token;
//             if (!token) {
//                 socket.emit('error', 'This is an error message');
//                 return socket.disconnect();
//                 throw new ApiError(
//                     httpstatus.UNAUTHORIZED,
//                     'Un-authorized handshake. Token is missing',
//                 );
//             }
//
//             const verifiedToken = AuthUtils.verifyAccessToken(token);
//
//             const user = await prisma.user.findUnique({
//                 where: {
//                     id: verifiedToken?.id,
//                 },
//                 select: {
//                     id: true,
//                     email: true,
//                     fullName: true,
//                     role: true,
//                     avatar: true,
//                     isVerified: true,
//                 },
//             });
//
//             // retrieve the user
//             if (!user) {
//                 throw new ApiError(
//                     httpstatus.UNAUTHORIZED,
//                     'Un-authorized handshake. Token is invalid',
//                 );
//             }
//             socket.user = user; // mount te user object to the socket
//             socket.join(user.id);
//             socket.emit(ChatEventEnum.CONNECTED_EVENT);
//
//             console.log('User connected 🗼. userId: ', user.id);
//
//             // when user disconnects
//             socket.on(ChatEventEnum.DISCONNECT_EVENT, () => {
//                 console.log(
//                     'user has disconnected 🚫. userId: ' + socket.user?.id,
//                 );
//                 if (socket.user?.id) {
//                     socket.leave(socket.user.id);
//                 }
//             });
//         } catch (error: any) {
//             console.log('🚨 socket connection error', error);
//             socket.emit(
//                 ChatEventEnum.SOCKET_ERROR_EVENT,
//                 error?.message ||
//                     'Something went wrong while connecting to the socket.',
//             );
//         }
//     });
// };

const initializeScoketIO = (io: Server) => {
    setupWaiterSocketNamespace(io);
};

enum SOCKET_NAMESPACES {
    WAITER = '/waiter',
    CHEF = '/chef',
    CUSTOMER = '/customer',
}

const emitSocketEvent = (
    req: Request,
    roomId: string,
    event: string,
    payload: any,
    socketNamespace: SOCKET_NAMESPACES,
) => {
    const io: Server = req.app.get('io');
    // console.log('🚀 i  : ', i);
    // console.log('🚀 roomId : ', roomId);
    // console.log('🚀 event : ', event);
    // console.log('🚀 payload : ', payload);
    // console.log('🚀 namespace: ', socketNamespace);
    io.of(socketNamespace).to(roomId).emit(event, payload);
};

export { initializeScoketIO, emitSocketEvent, SOCKET_NAMESPACES };
