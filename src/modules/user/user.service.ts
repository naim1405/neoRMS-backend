import ApiError from '../../utils/ApiError';
import httpstatus from 'http-status';
import prisma from '../../utils/prisma';
import { AuthUtils } from '../../utils/AuthUtils';
import { Prisma, UserRole } from '@prisma/client';
import { ISignupUser, ICreateStaffUser, IUpdateUser } from './user.types';
import { JwtPayload } from '../../types/jwt.types';

/**
 * Shared helper: ensure a user email is not already taken
 */
const assertEmailNotTaken = async (email: string) => {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        throw new ApiError(httpstatus.CONFLICT, 'Email is already in use');
    }
};

/**
 * Shared helper: get restaurant IDs that belong to the requesting user (any role)
 */
const getRestaurantIds = async (userId: string): Promise<string[]> => {
    const [chef, waiter, manager, owner] = await Promise.all([
        prisma.chef.findUnique({
            where: { userId },
            select: { restaurantId: true },
        }),
        prisma.waiter.findUnique({
            where: { userId },
            select: { restaurantId: true },
        }),
        prisma.manager.findUnique({
            where: { userId },
            select: { restaurantId: true },
        }),
        prisma.owner.findUnique({
            where: { userId },
            include: { restaurants: { select: { id: true } } },
        }),
    ]);

    const ids: string[] = [];
    if (chef) ids.push(chef.restaurantId);
    if (waiter) ids.push(waiter.restaurantId);
    if (manager) ids.push(manager.restaurantId);
    if (owner) ids.push(...owner.restaurants.map(r => r.id));
    return ids;
};

// ─── Public signup (CUSTOMER or OWNER only) ────────────────────────────────────

const signup = async (payload: ISignupUser) => {
    await assertEmailNotTaken(payload.email);

    const hashedPassword = await AuthUtils.hashPassword(payload.password);
    const user = await prisma.$transaction(async tx => {
        const user = await tx.user.create({
            data: {
                email: payload.email,
                fullName: payload.fullName,
                password: hashedPassword,
                avatar: payload.avatar,
                role: payload.role as UserRole,
                isVerified: true, // TODO: set to false and send OTP in production
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                avatar: true,
                isVerified: true,
                createdAt: true,
            },
        });
        if (payload.role === UserRole.OWNER) {
            await tx.owner.create({
                data: {
                    userId: user.id,
                },
            });
        } else if (payload.role === UserRole.CUSTOMER) {
            await tx.customer.create({
                data: {
                    userId: user.id,
                },
            });
        }

        return user;
    });

    return user;
};

// ─── Staff creation helpers ────────────────────────────────────────────────────

const createStaffUser = async (
    requesterId: string,
    targetRole: UserRole,
    payload: ICreateStaffUser,
    tenantId: string,
) => {
    // Verify the restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
        where: { id: payload.restaurantId },
    });
    if (!restaurant) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Restaurant not found');
    }

    await assertEmailNotTaken(payload.email);

    const hashedPassword = await AuthUtils.hashPassword(payload.password);

    const newUser = await prisma.user.create({
        data: {
            email: payload.email,
            fullName: payload.fullName,
            password: hashedPassword,
            avatar: payload.avatar,
            role: targetRole,
            isVerified: true,
            lastUpdatedBy: requesterId,
        },
        select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            avatar: true,
            createdAt: true,
        },
    });

    // Associate the new user with the restaurant via their role-specific model
    if (targetRole === UserRole.CHEF) {
        await prisma.chef.create({
            data: {
                userId: newUser.id,
                restaurantId: payload.restaurantId,
                tenantId,
                lastUpdatedBy: requesterId,
            },
        });
    } else if (targetRole === UserRole.WAITER) {
        await prisma.waiter.create({
            data: {
                userId: newUser.id,
                restaurantId: payload.restaurantId,
                tenantId,
                lastUpdatedBy: requesterId,
            },
        });
    } else if (targetRole === UserRole.MANAGER) {
        await prisma.manager.create({
            data: {
                userId: newUser.id,
                restaurantId: payload.restaurantId,
                tenantId,
                lastUpdatedBy: requesterId,
            },
        });
    }

    return newUser;
};

// OWNER creates MANAGER
const createManager = async (
    requesterId: string,
    payload: ICreateStaffUser,
    tenantId: string,
) => {
    return createStaffUser(requesterId, UserRole.MANAGER, payload, tenantId);
};

// OWNER or MANAGER creates CHEF
const createChef = async (
    requesterId: string,
    payload: ICreateStaffUser,
    tenantId: string,
) => {
    return createStaffUser(requesterId, UserRole.CHEF, payload, tenantId);
};

// OWNER or MANAGER creates WAITER
const createWaiter = async (
    requesterId: string,
    payload: ICreateStaffUser,
    tenantId: string,
) => {
    return createStaffUser(requesterId, UserRole.WAITER, payload, tenantId);
};

// ─── Profile ──────────────────────────────────────────────────────────────────

const getMyProfile = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            avatar: true,
            isVerified: true,
            createdAt: true,
            updatedAt: true,
            Owner: {
                select: {
                    restaurants: {
                        select: {
                            id: true,
                            tenantId: true,
                            name: true,
                            location: true,
                        },
                    },
                },
            },
            Chef: {
                select: {
                    restaurant: {
                        select: {
                            id: true,
                            tenantId: true,
                            name: true,
                            location: true,
                        },
                    },
                },
            },
            Waiter: {
                select: {
                    restaurant: {
                        select: {
                            id: true,
                            tenantId: true,
                            name: true,
                            location: true,
                        },
                    },
                },
            },
            Manager: {
                select: {
                    restaurant: {
                        select: {
                            id: true,
                            tenantId: true,
                            name: true,
                            location: true,
                        },
                    },
                },
            },
        },
    });

    if (!user) {
        throw new ApiError(httpstatus.NOT_FOUND, 'User not found');
    }

    return user;
};

const updateMyProfile = async (userId: string, payload: IUpdateUser) => {
    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            ...(payload.fullName && { fullName: payload.fullName }),
            ...(payload.avatar !== undefined && { avatar: payload.avatar }),
        },
        select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            avatar: true,
            updatedAt: true,
        },
    });

    return user;
};

// ─── Delete (role-scoped) ─────────────────────────────────────────────────────

const deleteUser = async (
    requester: JwtPayload,
    targetUserId: string,
    tenantId: string,
) => {
    const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
    });

    if (!targetUser) {
        throw new ApiError(httpstatus.NOT_FOUND, 'User not found');
    }

    // Enforce role-based delete permissions
    if (requester.role === UserRole.OWNER) {
        if (targetUser.role !== UserRole.MANAGER) {
            throw new ApiError(
                httpstatus.FORBIDDEN,
                'Owners can only delete managers',
            );
        }
    } else if (requester.role === UserRole.MANAGER) {
        if (
            targetUser.role !== UserRole.CHEF &&
            targetUser.role !== UserRole.WAITER
        ) {
            throw new ApiError(
                httpstatus.FORBIDDEN,
                'Managers can only delete chefs and waiters',
            );
        }
    } else {
        throw new ApiError(
            httpstatus.FORBIDDEN,
            'You do not have permission to delete users',
        );
    }

    await prisma.$transaction(async tx => {
        // Remove the role-specific record for the target user, then delete the user
        await Promise.all([
            tx.chef.updateMany({
                where: {
                    AND: [{ userId: targetUserId }, { tenantId: tenantId }],
                },
                data: {
                    isDeleted: true,
                    deletedBy: requester.id,
                },
            }),

            tx.waiter.updateMany({
                where: {
                    AND: [{ userId: targetUserId }, { tenantId: tenantId }],
                },
                data: {
                    isDeleted: true,
                    deletedBy: requester.id,
                },
            }),

            tx.manager.updateMany({
                where: {
                    AND: [{ userId: targetUserId }, { tenantId: tenantId }],
                },
                data: {
                    isDeleted: true,
                    deletedBy: requester.id,
                },
            }),
        ]);

        await tx.user.update({
            where: { id: targetUserId },
            data: {
                isDeleted: true,
                deletedBy: requester.id,
            },
        });
    });

    return { message: 'User deleted successfully' };
};

// ─── Get restaurant staff ─────────────────────────────────────────────────────

const getRestaurantStaff = async (
    requesterId: string,
    restaurantId: string,
    tenantId: string,
) => {
    const userSelect = {
        select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            avatar: true,
            isVerified: true,
            createdAt: true,
        },
    };

    const whereConditions = {
        restaurantId: restaurantId,
        tenantId: tenantId,
        isDeleted: false,
    };

    const [chefs, waiters, managers] = await Promise.all([
        prisma.chef.findMany({
            where: whereConditions,
            select: { user: userSelect },
        }),
        prisma.waiter.findMany({
            where: whereConditions,
            select: { user: userSelect },
        }),
        prisma.manager.findMany({
            where: whereConditions,
            select: { user: userSelect },
        }),
    ]);

    return [
        ...chefs.map(c => c.user),
        ...waiters.map(w => w.user),
        ...managers.map(m => m.user),
    ];
};

export const userService = {
    signup,
    createManager,
    createChef,
    createWaiter,
    getMyProfile,
    updateMyProfile,
    deleteUser,
    getRestaurantStaff,
};
