import ApiError from '../../utils/ApiError';
import httpstatus from 'http-status';
import prisma from '../../utils/prisma';
import { ICreateRestaurant, IUpdateRestaurant } from './restaurant.types';
import { JwtPayload } from '../../types/jwt.types';

const createRestaurant = async (
    payload: ICreateRestaurant,
    user: JwtPayload,
) => {
    const owner = await prisma.owner.findUnique({
        where: { userId: user.id },
        select: { tenantId: true },
    });
    if (!owner) {
        throw new ApiError(httpstatus.FORBIDDEN, 'Only owners can create restaurants');
    }

    const restaurant = await prisma.restaurant.create({
        data: {
            name: payload.name,
            tagline: payload.tagline,
            description: payload.description,
            location: payload.location,
            contactInfo: payload.contactInfo,
            bannerImage: payload.bannerImage,
            tenantId: owner.tenantId,
            ownerId: user.id,
        },
    });

    return restaurant;
};

const updateRestaurant = async (id: string, payload: IUpdateRestaurant) => {
    const restaurant = await prisma.restaurant.findUnique({ where: { id } });
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
        include: { menuProducts: true },
    });
    if (!restaurant) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Restaurant not found');
    }
    return restaurant;
};

const getAllRestaurants = async () => {
    const restaurants = await prisma.restaurant.findMany({
        include: { menuProducts: true },
    });
    return restaurants;
};

const getRestaurantsByUserId = async (userId: string) => {
    const [ownerRecord, chefRecord, waiterRecord, managerRecord] = await Promise.all([
        prisma.owner.findUnique({
            where: { userId },
            include: { restaurants: { include: { menuProducts: true } } },
        }),
        prisma.chef.findUnique({
            where: { userId },
            include: { restaurant: { include: { menuProducts: true } } },
        }),
        prisma.waiter.findUnique({
            where: { userId },
            include: { restaurant: { include: { menuProducts: true } } },
        }),
        prisma.manager.findUnique({
            where: { userId },
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
