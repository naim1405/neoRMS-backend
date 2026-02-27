import httpstatus from 'http-status';
import ApiError from '../../utils/ApiError';
import prisma from '../../utils/prisma';
import {
    IAdjustQuantity,
    ICreateRestaurantInventory,
    IUpdateRestaurantInventory,
} from './inventory.types';

// ── InventoryIngredient ───────────────────────────────────────────────────────

const getAllInventoryIngredients = async () => {
    return prisma.inventoryIngredient.findMany({
        orderBy: { name: 'asc' },
    });
};

// ── RestaurantInventory ───────────────────────────────────────────────────────

const getRestaurantInventory = async (restaurantId: string) => {
    await assertRestaurantExists(restaurantId);
    return prisma.restaurantInventory.findMany({
        where: { restaurantId },
        include: { ingredient: true },
        orderBy: { createdAt: 'desc' },
    });
};

const createRestaurantInventory = async (
    restaurantId: string,
    payload: ICreateRestaurantInventory,
) => {
    await assertRestaurantExists(restaurantId);

    let ingredientId = payload.ingredientId;

    if (!ingredientId) {
        // Create a new InventoryIngredient if one with this name doesn't exist yet
        const existing = await prisma.inventoryIngredient.findUnique({
            where: { name: payload.name! },
        });
        if (existing) {
            ingredientId = existing.id;
        } else {
            const created = await prisma.inventoryIngredient.create({
                data: { name: payload.name!, unit: payload.unit! },
            });
            ingredientId = created.id;
        }
    } else {
        // Verify the provided ingredientId actually exists
        const ingredient = await prisma.inventoryIngredient.findUnique({
            where: { id: ingredientId },
        });
        if (!ingredient) {
            throw new ApiError(httpstatus.NOT_FOUND, 'Inventory ingredient not found');
        }
    }

    // Prevent duplicate entries for the same restaurant + ingredient
    const duplicate = await prisma.restaurantInventory.findUnique({
        where: { restaurantId_ingredientId: { restaurantId, ingredientId } },
    });
    if (duplicate) {
        throw new ApiError(
            httpstatus.CONFLICT,
            'This ingredient is already in the restaurant inventory',
        );
    }

    return prisma.restaurantInventory.create({
        data: {
            restaurantId,
            ingredientId,
            availableQuantity: payload.availableQuantity,
            thresholdQuantity: payload.thresholdQuantity,
        },
        include: { ingredient: true },
    });
};

const updateRestaurantInventory = async (
    restaurantInventoryId: string,
    restaurantId: string,
    payload: IUpdateRestaurantInventory,
) => {
    await assertInventoryEntryExists(restaurantInventoryId, restaurantId);

    return prisma.restaurantInventory.update({
        where: { id: restaurantInventoryId },
        data: payload,
        include: { ingredient: true },
    });
};

const deleteRestaurantInventory = async (
    restaurantInventoryId: string,
    restaurantId: string,
) => {
    await assertInventoryEntryExists(restaurantInventoryId, restaurantId);
    await prisma.restaurantInventory.delete({ where: { id: restaurantInventoryId } });
};

const addQuantity = async (
    restaurantInventoryId: string,
    restaurantId: string,
    payload: IAdjustQuantity,
) => {
    const entry = await assertInventoryEntryExists(restaurantInventoryId, restaurantId);

    return prisma.restaurantInventory.update({
        where: { id: restaurantInventoryId },
        data: { availableQuantity: entry.availableQuantity + payload.amount },
        include: { ingredient: true },
    });
};

const subtractQuantity = async (
    restaurantInventoryId: string,
    restaurantId: string,
    payload: IAdjustQuantity,
) => {
    const entry = await assertInventoryEntryExists(restaurantInventoryId, restaurantId);

    const newQuantity = entry.availableQuantity - payload.amount;
    if (newQuantity < 0) {
        throw new ApiError(
            httpstatus.BAD_REQUEST,
            'Insufficient quantity — cannot go below 0',
        );
    }

    return prisma.restaurantInventory.update({
        where: { id: restaurantInventoryId },
        data: { availableQuantity: newQuantity },
        include: { ingredient: true },
    });
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const assertRestaurantExists = async (restaurantId: string) => {
    const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
    });
    if (!restaurant) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Restaurant not found');
    }
    return restaurant;
};

const assertInventoryEntryExists = async (
    restaurantInventoryId: string,
    restaurantId: string,
) => {
    const entry = await prisma.restaurantInventory.findFirst({
        where: { id: restaurantInventoryId, restaurantId },
    });
    if (!entry) {
        throw new ApiError(
            httpstatus.NOT_FOUND,
            'Restaurant inventory entry not found',
        );
    }
    return entry;
};

export const inventoryService = {
    getAllInventoryIngredients,
    getRestaurantInventory,
    createRestaurantInventory,
    updateRestaurantInventory,
    deleteRestaurantInventory,
    addQuantity,
    subtractQuantity,
};
