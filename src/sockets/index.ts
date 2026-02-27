import { Server } from 'socket.io';
import { Request } from 'express';
import { setupWaiterSocketNamespace } from './waiterSocket';
import { setupChefSocketNamespace } from './chefSocket';
import { setupCustomerSocketNamespace } from './customerSocket';
import { SOCKET_NAMESPACES } from './socket.types';

const initializeScoketIO = (io: Server) => {
    setupWaiterSocketNamespace(io);
    setupChefSocketNamespace(io);
    setupCustomerSocketNamespace(io);
};

const emitSocketEvent = (
    req: Request,
    socketNamespace: SOCKET_NAMESPACES,
    roomId: string,
    event: string,
    payload: any,
) => {
    const io: Server = req.app.get('io');
    io.of(socketNamespace).to(roomId).emit(event, payload);
};

export { initializeScoketIO, emitSocketEvent, SOCKET_NAMESPACES };
