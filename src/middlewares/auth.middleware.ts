import ApiError from '../utils/ApiError';
import httpstatus from 'http-status';
import { NextFunction, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthUtils } from '../utils/AuthUtils';

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
            throw new ApiError(httpstatus.UNAUTHORIZED, 'Invalid token');
        }
    };
