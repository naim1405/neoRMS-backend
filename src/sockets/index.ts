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
import { setupChefSocketNamespace } from './chefSocket';
import { setupCustomerSocketNamespace } from './customerSocket';
import { SOCKET_NAMESPACES } from './socket.types';

const initializeScoketIO = (io: Server) => {
    setupWaiterSocketNamespace(io);
    setupChefSocketNamespace(io);
    setupCustomerSocketNamespace(io);
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
