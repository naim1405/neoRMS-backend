import httpstatus from 'http-status';
import ApiError from '../../utils/ApiError';
import prisma from '../../utils/prisma';
import { ICreateMenuProduct, IUpdateMenuProduct } from './menuProduct.types';

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

const getMenuProductsByRestaurant = async (
    restaurantId: string,
    customerId: string | null,
) => {
    const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId, isDeleted: false },
    });
    if (!restaurant) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Restaurant not found');
    }

    if (customerId) {
        //TODO: get reccomendation
        const previousOrders = await prisma.order.findMany({
            where: {
                customerId: customerId,
                restaurantId: restaurantId,
            },
            select: {
                id: true,
                items: {
                    select: {
                        menuItemId: true,
                    },
                },
            },
        });

        const result = previousOrders.reduce<Record<string, string[]>>(
            (acc, { id, items }) => {
                acc[id] = items.map(item => item.menuItemId);
                return acc;
            },
            {},
        );

        console.log('🚀 result : ', result);
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

export const menuProductService = {
    createMenuProduct,
    updateMenuProduct,
    deleteMenuProduct,
    getMenuProductsByRestaurant,
    getMenuProductById,
};
