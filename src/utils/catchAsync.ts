import { NextFunction, Request, RequestHandler, Response } from 'express';
import ApiError from './ApiError';
import httpstatus from 'http-status';

const catchAsync =
    (fn: RequestHandler) =>
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await fn(req, res, next);
        } catch (error) {
            next(error);
        }
    };

export function withTryCatch(fn: any) {
    return async (...args: any) => {
        try {
            return await fn(...args);
        } catch (err) {
            return new ApiError(
                httpstatus.INTERNAL_SERVER_ERROR,
                'Internal Server Error',
            );
        }
    };
}

export default catchAsync;
