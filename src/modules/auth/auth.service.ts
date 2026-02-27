import ApiError from '../../utils/ApiError';
import httpstatus from 'http-status';
import { JwtPayload } from '../../types/jwt.types';
import jwt from 'jsonwebtoken';
import config from '../../config';
import { Profile } from 'passport';
import prisma from '../../utils/prisma';

import { AuthUtils } from '../../utils/AuthUtils';
import { ILoginUser } from './auth.types';

import { User, UserRole } from '@prisma/client';
//

const generateAccessAndRefreshToken = async (user: User) => {
    try {
        const accessToken = await AuthUtils.generateAccessToken({
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
        });
        const refreshToken = await AuthUtils.generateRefreshToken({
            id: user.id,
        });
        user.refreshToken = refreshToken;
        await prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                refreshToken: refreshToken,
            },
        });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            httpstatus.INTERNAL_SERVER_ERROR,
            'Failed to generate tokens',
        );
    }
};

const loginUser = async (payload: ILoginUser, allowedRoles: UserRole[]) => {
    const { email, password } = payload;

    const user = await prisma.user.findUnique({
        where: {
            email: email,
            role: {
                in: allowedRoles,
            },
        },
    });
    if (!user) {
        throw new ApiError(httpstatus.NOT_FOUND, 'User not found');
    }

    if (!user.password || user?.authProvider !== 'local') {
        throw new ApiError(
            httpstatus.BAD_REQUEST,
            'You have registered using other auth provider. Please use that to login.',
        );
    }

    const isPasswordMatched = await AuthUtils.isPasswordMatched(
        password,
        user.password,
    );

    if (!isPasswordMatched) {
        throw new ApiError(httpstatus.UNAUTHORIZED, 'Incorrect password');
    }

    const loggedUser = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        role: user.role,
    };
    const { accessToken, refreshToken } =
        await generateAccessAndRefreshToken(user);
    return { accessToken, refreshToken, user: loggedUser };
};

const logoutUser = async (user: JwtPayload) => {
    const userId = user.id;
    await prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            refreshToken: null,
        },
    });
};

const refreshAccessToken = async (incomingRefreshToken: string) => {
    const decodedToken = jwt.verify(
        incomingRefreshToken,
        config.jwt.refreshSecret,
    ) as JwtPayload;
    const user = await prisma.user.findUnique({
        where: {
            id: decodedToken.id,
        },
    });

    if (!user) {
        throw new ApiError(httpstatus.UNAUTHORIZED, 'Invalid refresh token');
    }
    if (incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(httpstatus.UNAUTHORIZED, 'Refresh token is expired');
    }
    const { accessToken, refreshToken } =
        await generateAccessAndRefreshToken(user);

    return { accessToken, refreshToken };
};

const verifyEmail = async (token: string, otp: number) => {
    const verifiedToken = jwt.verify(
        token,
        config.jwt.accessSecret,
    ) as JwtPayload;

    if (!verifiedToken || !verifiedToken.id) {
        throw new ApiError(httpstatus.UNAUTHORIZED, 'Invalid token');
    }
    if (!otp) {
        throw new ApiError(httpstatus.BAD_REQUEST, 'OTP is required');
    }
    const user = await prisma.user.findUnique({
        where: { id: verifiedToken.id },
    });
    if (!user) {
        throw new ApiError(httpstatus.NOT_FOUND, 'User not found');
    }
    if (user.isVerified) {
        throw new ApiError(httpstatus.BAD_REQUEST, 'User already verified');
    }
    if (user.verificationOTP !== otp) {
        throw new ApiError(httpstatus.BAD_REQUEST, 'Invalid OTP');
    }
    await prisma.user.update({
        where: { id: user.id },
        data: {
            isVerified: true,
            verificationOTP: null,
        },
    });
};

const googleAuthSuccess = async (profile: Profile) => {
    const email = profile.emails?.[0]?.value;
    const fullName = profile.displayName;
    const avatar = profile.photos?.[0]?.value;
    const provider = profile.provider;
    if (!email) {
        throw new ApiError(
            httpstatus.BAD_REQUEST,
            'Email not found from Google account',
        );
    }

    let user = await prisma.user.findUnique({
        where: { email: email },
    });

    if (!user) {
        // First-time login → create new user
        user = await prisma.user.create({
            data: {
                email: email,
                fullName: fullName,
                role: UserRole.MANAGER,
                authProvider: provider,
                avatar: avatar,
                isVerified: true,
            },
        });
    } else {
        prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                fullName: fullName,
                avatar: avatar,
                authProvider: provider,
                isVerified: true,
            },
        });
    }

    const { accessToken, refreshToken } =
        await generateAccessAndRefreshToken(user);

    return { accessToken, refreshToken };
};

export const authService = {
    loginUser,
    logoutUser,
    refreshAccessToken,
    verifyEmail,
    googleAuthSuccess,
};
