import httpstatus from 'http-status';
import ApiError from '../../utils/ApiError';
import prisma from '../../utils/prisma';
import {
    ICreateMenuProduct,
    IGetRecommendationPayload,
    IUpdateMenuProduct,
} from './menuProduct.types';
import { JwtPayload } from '../../types/jwt.types';
import { aiService } from '../aiService';

const createMenuProduct = async (
    restaurantId: string,
    payload: ICreateMenuProduct,
    tenantId: string,
) => {
    const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId, tenantId, isDeleted: false },
    });
    if (!restaurant) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Restaurant not found');
    }

    const { variants, addons, ...productData } = payload;

    const menuProduct = await prisma.menuProduct.create({
        data: {
            ...productData,
            restaurantId,
            tenantId: restaurant.tenantId,
            variants: variants ? { create: variants } : undefined,
            addons: addons ? { create: addons } : undefined,
        },
        include: {
            variants: true,
            addons: true,
        },
    });

    return menuProduct;
};

const updateMenuProduct = async (
    menuProductId: string,
    restaurantId: string,
    payload: IUpdateMenuProduct,
    tenantId: string,
) => {
    const menuProduct = await prisma.menuProduct.findFirst({
        where: { id: menuProductId, restaurantId, tenantId, isDeleted: false },
    });
    if (!menuProduct) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Menu product not found');
    }

    const updated = await prisma.menuProduct.update({
        where: { id: menuProductId },
        data: payload,
        include: {
            variants: true,
            addons: true,
            ingredients: { include: { ingredient: true } },
        },
    });

    return updated;
};

const deleteMenuProduct = async (
    menuProductId: string,
    restaurantId: string,
    tenantId: string,
) => {
    const menuProduct = await prisma.menuProduct.findFirst({
        where: { id: menuProductId, restaurantId, tenantId, isDeleted: false },
    });
    if (!menuProduct) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Menu product not found');
    }

    await prisma.menuProduct.delete({ where: { id: menuProductId } });
};

const getMenuProductsByRestaurant = async (restaurantId: string) => {
    const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId, isDeleted: false },
    });
    if (!restaurant) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Restaurant not found');
    }

    const menuProducts = await prisma.menuProduct.findMany({
        where: { restaurantId, isDeleted: false },
        include: {
            variants: true,
            addons: true,
            ingredients: { include: { ingredient: true } },
            reviews: true,
        },
    });

    return menuProducts;
};

const getMenuProductById = async (
    menuProductId: string,
    restaurantId: string,
) => {
    const menuProduct = await prisma.menuProduct.findFirst({
        where: { id: menuProductId, restaurantId, isDeleted: false },
        include: {
            variants: true,
            addons: true,
            ingredients: { include: { ingredient: true } },
            reviews: {
                include: {
                    customer: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    avatar: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
    if (!menuProduct) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Menu product not found');
    }

    return menuProduct;
};

const getRecommendation = async (
    payload: IGetRecommendationPayload,
    tenantId: string,
    user: JwtPayload,
) => {
    const restaurant = await prisma.restaurant.findUnique({
        where: { tenantId: tenantId, isDeleted: false },
    });
    if (!restaurant) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Restaurant not found');
    }
    const aiRecommendations = await aiService.getRecommendation({
        already_ordered: payload.cartItems,
        num_recommendations: 4,
        restaurant_id: restaurant.id,
    });

    if (!aiRecommendations || !aiRecommendations?.recommendations) {
        throw new ApiError(
            httpstatus.INTERNAL_SERVER_ERROR,
            'Failed to get recommendations',
        );
    }

    const menuItems = await prisma.menuProduct.findMany({
        where: {
            id: { in: aiRecommendations.recommendations },
            restaurantId: restaurant.id,
            isDeleted: false,
        },
        include: {
            variants: true,
            addons: true,
        },
    });

    return menuItems;
};

export const menuProductService = {
    createMenuProduct,
    updateMenuProduct,
    deleteMenuProduct,
    getMenuProductsByRestaurant,
    getMenuProductById,
    getRecommendation,
};
