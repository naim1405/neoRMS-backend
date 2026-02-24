import ApiError from '../../utils/ApiError';
import sendResponse from '../../utils/ApiResponse';
import catchAsync from '../../utils/catchAsync';
import httpstatus from 'http-status';
import { JwtPayload } from '../../types/jwt.types';
import { Profile } from 'passport';
import { authService } from './auth.service';
import { UserRole } from '@/lib/prismaEnums';

const cookieOptions: any = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
};
const registerUser = catchAsync(async (req, res) => {
    const result = await authService.registerUser(req.body, UserRole.MANAGER);
    const { accessToken } = result;

    res.cookie('accessToken', accessToken, cookieOptions);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'User registered successfully',
        data: null,
    });
});

const loginUser = catchAsync(async (req, res) => {
    const result = await authService.loginUser(req.body);
    const { accessToken, refreshToken } = result;

    res.cookie('refreshToken', refreshToken, cookieOptions);
    res.cookie('accessToken', accessToken, cookieOptions);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'User logged in successfully',
        data: {
            accessToken,
            user: result.user,
        },
    });
});

const logoutUser = catchAsync(async (req: any, res) => {
    await authService.logoutUser(req.user as JwtPayload);
    res.clearCookie('refreshToken', cookieOptions);
    res.clearCookie('accessToken', cookieOptions);
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'User logged out successfully',
    });
});

const refreshAccessToken = catchAsync(async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(
            httpstatus.UNAUTHORIZED,
            'Please provide refresh token',
        );
    }
    const result = await authService.refreshAccessToken(incomingRefreshToken);

    const { accessToken, refreshToken } = result;

    res.cookie('refreshToken', refreshToken, cookieOptions);
    res.cookie('accessToken', accessToken, cookieOptions);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Access Token refreshed successfully',
        data: {
            accessToken,
        },
    });
});

const verifyEmail = catchAsync(async (req, res) => {
    const accessToken =
        req.cookies?.accessToken ||
        req.headers.authorization?.split(' ')[1] ||
        '';
    const { otp } = req.body;
    await authService.verifyEmail(accessToken, otp);

    res.clearCookie('refreshToken', cookieOptions);
    res.clearCookie('accessToken', cookieOptions);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Email verified successfully. Please login again',
    });
});

const googleAuthSuccess = catchAsync(async (req, res) => {
    const profile = req.user as Profile;

    if (!profile) {
        throw new ApiError(
            httpstatus.UNAUTHORIZED,
            'Google authentication failed',
        );
    }

    const result = await authService.googleAuthSuccess(profile);
    const { accessToken, refreshToken } = result;

    res.cookie('refreshToken', refreshToken, cookieOptions);
    res.cookie('accessToken', accessToken, cookieOptions);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'User logged in successfully',
        data: {
            accessToken,
        },
    });
});

const registerAdmin = catchAsync(async (req, res) => {
    const result = await authService.registerUser(req.body, UserRole.MANAGER);
    const { accessToken } = result;

    res.cookie('accessToken', accessToken, cookieOptions);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Admin registered successfully',
        data: null,
    });
});

export const authController = {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    verifyEmail,
    googleAuthSuccess,
    registerAdmin,
};
