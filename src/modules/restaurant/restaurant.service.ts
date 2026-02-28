import ApiError from '../../utils/ApiError';
import httpstatus from 'http-status';
import prisma from '../../utils/prisma';
import { ICreateRestaurant, IUpdateRestaurant } from './restaurant.types';
import { JwtPayload } from '../../types/jwt.types';
import { generateSlugWithNanoId } from '../../utils/identifier';

const createRestaurant = async (
    payload: ICreateRestaurant,
    user: JwtPayload,
) => {
    const restaurant = await prisma.$transaction(async tx => {
        const tenant = await tx.tenant.create({
            data: {
                name: payload.name,
                ownerId: user.id,
                slug: generateSlugWithNanoId(payload.name),
            },
        });
        const restaurant = await tx.restaurant.create({
            data: {
                name: payload.name,
                tagline: payload.tagline,
                description: payload.description,
                location: payload.location,
                contactInfo: payload.contactInfo,
                bannerImage: payload.bannerImage,
                ownerId: user.id,
                tenantId: tenant.id,
            },
        });

        return restaurant;
    });

    return restaurant;
};

const updateRestaurant = async (
    id: string,
    payload: IUpdateRestaurant,
    tenantId: string,
) => {
    const restaurant = await prisma.restaurant.findUnique({
        where: { id, tenantId },
    });
    if (!restaurant) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Restaurant not found');
    }

    const updated = await prisma.restaurant.update({
        where: { id },
        data: payload,
    });
    return updated;
};

const getRestaurantById = async (id: string) => {
    const restaurant = await prisma.restaurant.findUnique({
        where: { id },
        select: {
            id: true,
            tenantId: true,
            name: true,
            tagline: true,
            description: true,
            location: true,
            contactInfo: true,
            bannerImage: true,
            menuProducts: true,
            tables: true,
        },
    });
    if (!restaurant) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Restaurant not found');
    }
    return restaurant;
};

const getAllRestaurants = async () => {
    const restaurants = await prisma.restaurant.findMany({
        select: {
            id: true,
            tenantId: true,
            name: true,
            tagline: true,
            description: true,
            location: true,
            contactInfo: true,
            bannerImage: true,
        },
    });
    return restaurants;
};

const getRestaurantsByUserId = async (user: JwtPayload) => {
    const userId = user.id;
    const [ownerRecord, chefRecord, waiterRecord, managerRecord] =
        await Promise.all([
            prisma.owner.findUnique({
                where: { userId, isDeleted: false },
                include: { restaurants: { include: { menuProducts: true } } },
            }),
            prisma.chef.findUnique({
                where: { userId, isDeleted: false },
                include: { restaurant: { include: { menuProducts: true } } },
            }),
            prisma.waiter.findUnique({
                where: { userId, isDeleted: false },
                include: { restaurant: { include: { menuProducts: true } } },
            }),
            prisma.manager.findUnique({
                where: { userId, isDeleted: false },
                include: { restaurant: { include: { menuProducts: true } } },
            }),
        ]);

    const restaurants = [
        ...(ownerRecord?.restaurants ?? []),
        ...(chefRecord ? [chefRecord.restaurant] : []),
        ...(waiterRecord ? [waiterRecord.restaurant] : []),
        ...(managerRecord ? [managerRecord.restaurant] : []),
    ];

    return restaurants;
};

export const restaurantService = {
    createRestaurant,
    updateRestaurant,
    getRestaurantById,
    getAllRestaurants,
    getRestaurantsByUserId,
};
