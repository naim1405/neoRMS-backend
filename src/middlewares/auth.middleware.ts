import ApiError from '../utils/ApiError';
import httpstatus from 'http-status';
import { NextFunction, Response } from 'express';
import prisma from '../utils/prisma';
import { AuthUtils } from '../utils/AuthUtils';
import { Socket } from '../sockets/socket.types';

export const verifyJwt =
    (...requiredRoles: string[]) =>
    async (req: any, res: Response, next: NextFunction) => {
        try {
            const accessToken =
                req.cookies?.accessToken ||
                req.headers.authorization?.split(' ')[1];

            if (!accessToken) {
                throw new ApiError(
                    httpstatus.UNAUTHORIZED,
                    'You are not logged in',
                );
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
                throw new ApiError(httpstatus.UNAUTHORIZED, 'Invalid token');
            }
            if (!user.isVerified) {
                throw new ApiError(
                    httpstatus.UNAUTHORIZED,
                    'Please verify your email',
                );
            }
            req.user = user;

            if (requiredRoles.length && !requiredRoles.includes(user.role)) {
                throw new ApiError(httpstatus.FORBIDDEN, 'Forbidden');
            }
            next();
        } catch (err) {
            next(err);
        }
    };

export const verifyJwtSocket =
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
