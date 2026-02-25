import httpstatus from 'http-status';
import ApiError from '../../utils/ApiError';
import prisma from '../../utils/prisma';
import { ICreateMenuProduct, IUpdateMenuProduct } from './menuProduct.types';

const createMenuProduct = async (
    restaurantId: string,
    payload: ICreateMenuProduct,
) => {
    const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
    });
    if (!restaurant) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Restaurant not found');
    }

    const { variants, addons, ...productData } = payload;

    const menuProduct = await prisma.menuProduct.create({
        data: {
            ...productData,
            restaurantId,
            variants: variants
                ? { create: variants }
                : undefined,
            addons: addons
                ? { create: addons }
                : undefined,
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
) => {
    const menuProduct = await prisma.menuProduct.findFirst({
        where: { id: menuProductId, restaurantId },
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
) => {
    const menuProduct = await prisma.menuProduct.findFirst({
        where: { id: menuProductId, restaurantId },
    });
    if (!menuProduct) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Menu product not found');
    }

    await prisma.menuProduct.delete({ where: { id: menuProductId } });
};

const getMenuProductsByRestaurant = async (restaurantId: string) => {
    const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
    });
    if (!restaurant) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Restaurant not found');
    }

    const menuProducts = await prisma.menuProduct.findMany({
        where: { restaurantId },
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
        where: { id: menuProductId, restaurantId },
        include: {
            variants: true,
            addons: true,
            ingredients: { include: { ingredient: true } },
            reviews: { include: { user: { select: { id: true, fullName: true, avatar: true } } } },
        },
    });
    if (!menuProduct) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Menu product not found');
    }

    return menuProduct;
};

export const menuProductService = {
    createMenuProduct,
    updateMenuProduct,
    deleteMenuProduct,
    getMenuProductsByRestaurant,
    getMenuProductById,
};
