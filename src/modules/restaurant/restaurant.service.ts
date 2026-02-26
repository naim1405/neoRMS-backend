import ApiError from '../../utils/ApiError';
import httpstatus from 'http-status';
import prisma from '../../utils/prisma';
import { ICreateRestaurant, IUpdateRestaurant } from './restaurant.types';
import { JwtPayload } from '../../types/jwt.types';

const createRestaurant = async (
    payload: ICreateRestaurant,
    user: JwtPayload,
) => {
    const result = await prisma.$transaction(async tx => {
        const restaurant = await tx.restaurant.create({
            data: {
                name: payload.name,
                tagline: payload.tagline,
                description: payload.description,
                location: payload.location,
                contactInfo: payload.contactInfo,
                bannerImage: payload.bannerImage,
            },
        });

        await tx.associatedRestaurant.create({
            data: {
                userId: user.id,
                restaurantId: restaurant.id,
            },
        });

        return restaurant;
    });
    return result;
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
    const associated = await prisma.associatedRestaurant.findMany({
        where: { userId },
        include: {
            restaurant: {
                include: { menuProducts: true },
            },
        },
    });
    return associated.map(a => a.restaurant);
};

export const restaurantService = {
    createRestaurant,
    updateRestaurant,
    getRestaurantById,
    getAllRestaurants,
    getRestaurantsByUserId,
};
