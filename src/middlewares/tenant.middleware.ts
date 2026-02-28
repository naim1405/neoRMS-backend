import ApiError from '../utils/ApiError';
import httpstatus from 'http-status';
import { NextFunction, Response } from 'express';
import prisma from '../utils/prisma';
import { JwtPayload } from '../types/jwt.types';
import { UserRole } from '@prisma/client';
import { Socket, SocketUser } from '../sockets/socket.types';

async function verifyTenantAccess(req: any, res: Response, next: NextFunction) {
    try {
        const tenantId = req.headers['x-tenant-id'] as string;
        if (!tenantId) {
            throw new ApiError(
                httpstatus.BAD_REQUEST,
                'Tenant ID is required in x-tenant-id header',
            );
        }
        const user = req.user as JwtPayload;
        const accessVerified = await verifyAccess(user, tenantId);
        if (!accessVerified) {
            throw new ApiError(
                httpstatus.FORBIDDEN,
                'You do not have access to this tenant',
            );
        }
        req.tenantId = tenantId; // Attach tenantId to the request object for downstream use

        next();
    } catch (err) {
        next(err);
    }
}

async function verifyTenantAccessSocket(socket: Socket, next: any) {
    try {
        const tenantId = socket.handshake.headers['x-tenant-id'] as string;

        if (!tenantId) {
            const err = new Error('Invalid Tenant ID') as any;
            err.data = {
                status: httpstatus.BAD_REQUEST,
                message: 'Tenant ID is required in x-tenant-id header',
            };
            return next(err);
        }
        const user = socket.user as SocketUser;
        const accessVerified = await verifyAccess(user, tenantId);
        if (!accessVerified) {
            const err = new Error('Invalid Tenant ID') as any;
            err.data = {
                status: httpstatus.FORBIDDEN,
                message: 'You do not have access to this tenant',
            };
            return next(err);
        }
        socket.data.tenantId = tenantId; // Attach tenantId to the socket data for downstream use

        next();
    } catch (err) {
        next(err);
    }
}

async function verifyAccess(user: JwtPayload | SocketUser, tenantId: string) {
    let accessVerified = false;
    if (user.role === UserRole.CUSTOMER) {
        accessVerified = true;
    } else if (user.role === UserRole.CHEF) {
        const chef = await prisma.chef.findUnique({
            where: {
                id: user.id,
                tenantId: tenantId,
            },
        });
        if (chef) {
            accessVerified = true;
        }
    } else if (user.role === UserRole.WAITER) {
        const waiter = await prisma.waiter.findUnique({
            where: {
                id: user.id,
                tenantId: tenantId,
            },
        });
        if (waiter) {
            accessVerified = true;
        }
    } else if (user.role === UserRole.MANAGER) {
        const manager = await prisma.manager.findUnique({
            where: {
                id: user.id,
                tenantId: tenantId,
            },
        });
        if (manager) {
            accessVerified = true;
        }
    } else if (user.role === UserRole.OWNER) {
        const tenant = await prisma.tenant.findUnique({
            where: {
                ownerId: user.id,
                id: tenantId,
            },
        });
    }

    return accessVerified;
}

export { verifyTenantAccess, verifyTenantAccessSocket };
