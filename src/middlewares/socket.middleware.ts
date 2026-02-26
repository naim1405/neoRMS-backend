import httpstatus from 'http-status';
import prisma from '../utils/prisma';
import { Socket } from '../sockets/socket.types';
import { AuthUtils } from '../utils/AuthUtils';

export const verifyJwt =
    (...requiredRoles: string[]) =>
    async (socket: Socket, next: any) => {
        try {
            const accessToken =
                socket.handshake.auth?.token ||
                socket.handshake.headers?.authorization?.split(' ')[1];
            if (!accessToken) {
                const err = new Error('Token missing') as any;
                err.data = {
                    status: httpstatus.UNAUTHORIZED,
                    message: 'No auth token provided',
                };
                return next(err);
            }
            const verifiedToken = AuthUtils.verifyAccessToken(accessToken);

            const user = await prisma.user.findUnique({
                where: {
                    id: verifiedToken?.id,
                },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    isVerified: true,
                    role: true,
                },
            });
            if (!user) {
                const err = new Error('Invalid Token') as any;
                err.data = {
                    status: httpstatus.UNAUTHORIZED,
                    message: 'Invalid token',
                };
                return next(err);
            }
            if (!user.isVerified) {
                const err = new Error('Unverified Email') as any;
                err.data = {
                    status: httpstatus.UNAUTHORIZED,
                    message: 'Please verify your email',
                };
                return next(err);
            }
            socket.user = user;

            if (requiredRoles.length && !requiredRoles.includes(user.role)) {
                const err = new Error('Forbidded') as any;
                err.data = {
                    status: httpstatus.FORBIDDEN,
                    message: 'Forbidded',
                };
                return next(err);
            }
            next();
        } catch (error) {
            const err = new Error('Invalid token') as any;
            err.data = {
                status: httpstatus.UNAUTHORIZED,
                message: 'Invalid token',
            };
            return next(err);
        }
    };
