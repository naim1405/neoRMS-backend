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
        where: { isDeleted: false },
        orderBy: { name: 'asc' },
    });
};

// ── RestaurantInventory ───────────────────────────────────────────────────────

const getRestaurantInventory = async (
    restaurantId: string,
    tenantId: string,
) => {
    await assertRestaurantExists(restaurantId, tenantId);
    return prisma.restaurantInventory.findMany({
        where: { restaurantId, tenantId, isDeleted: false },
        include: { ingredient: true },
        orderBy: { createdAt: 'desc' },
    });
};

const createRestaurantInventory = async (
    restaurantId: string,
    tenantId: string,
    payload: ICreateRestaurantInventory,
    userId: string,
) => {
    await assertRestaurantExists(restaurantId, tenantId);

    let ingredientId = payload.ingredientId;

    if (!ingredientId) {
        // Create a new InventoryIngredient if one with this name doesn't exist yet
        const existing = await prisma.inventoryIngredient.findFirst({
            where: { name: payload.name!, isDeleted: false },
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
        // Verify the provided ingredientId actually exists and is not soft-deleted
        const ingredient = await prisma.inventoryIngredient.findFirst({
            where: { id: ingredientId, isDeleted: false },
        });
        if (!ingredient) {
            throw new ApiError(
                httpstatus.NOT_FOUND,
                'Inventory ingredient not found',
            );
        }
    }

    // Prevent duplicate active entries for the same restaurant + ingredient
    const duplicate = await prisma.restaurantInventory.findFirst({
        where: { restaurantId, ingredientId, isDeleted: false },
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
            tenantId,
            availableQuantity: payload.availableQuantity,
            lastUpdatedBy: userId,
            ...(payload.thresholdQuantity !== undefined && {
                thresholdQuantity: payload.thresholdQuantity,
            }),
        },
        include: { ingredient: true },
    });
};

const updateRestaurantInventory = async (
    restaurantInventoryId: string,
    restaurantId: string,
    tenantId: string,
    payload: IUpdateRestaurantInventory,
    userId: string,
) => {
    await assertInventoryEntryExists(
        restaurantInventoryId,
        restaurantId,
        tenantId,
    );

    return prisma.restaurantInventory.update({
        where: { id: restaurantInventoryId },
        data: { ...payload, lastUpdatedBy: userId },
        include: { ingredient: true },
    });
};

const deleteRestaurantInventory = async (
    restaurantInventoryId: string,
    restaurantId: string,
    tenantId: string,
    userId: string,
) => {
    await assertInventoryEntryExists(
        restaurantInventoryId,
        restaurantId,
        tenantId,
    );
    await prisma.restaurantInventory.update({
        where: { id: restaurantInventoryId },
        data: { isDeleted: true, deletedBy: userId, lastUpdatedBy: userId },
    });
};

const addQuantity = async (
    restaurantInventoryId: string,
    restaurantId: string,
    tenantId: string,
    payload: IAdjustQuantity,
    userId: string,
) => {
    const entry = await assertInventoryEntryExists(
        restaurantInventoryId,
        restaurantId,
        tenantId,
    );

    return prisma.restaurantInventory.update({
        where: { id: restaurantInventoryId },
        data: {
            availableQuantity: entry.availableQuantity + payload.amount,
            lastUpdatedBy: userId,
        },
        include: { ingredient: true },
    });
};

const subtractQuantity = async (
    restaurantInventoryId: string,
    restaurantId: string,
    tenantId: string,
    payload: IAdjustQuantity,
    userId: string,
) => {
    const entry = await assertInventoryEntryExists(
        restaurantInventoryId,
        restaurantId,
        tenantId,
    );

    const newQuantity = entry.availableQuantity - payload.amount;
    if (newQuantity < 0) {
        throw new ApiError(
            httpstatus.BAD_REQUEST,
            'Insufficient quantity — cannot go below 0',
        );
    }

    return prisma.restaurantInventory.update({
        where: { id: restaurantInventoryId },
        data: { availableQuantity: newQuantity, lastUpdatedBy: userId },
        include: { ingredient: true },
    });
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const assertRestaurantExists = async (
    restaurantId: string,
    tenantId: string,
) => {
    const restaurant = await prisma.restaurant.findFirst({
        where: { id: restaurantId, tenantId, isDeleted: false },
    });
    if (!restaurant) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Restaurant not found');
    }
    return restaurant;
};

const assertInventoryEntryExists = async (
    restaurantInventoryId: string,
    restaurantId: string,
    tenantId: string,
) => {
    const entry = await prisma.restaurantInventory.findFirst({
        where: {
            id: restaurantInventoryId,
            restaurantId,
            tenantId,
            isDeleted: false,
        },
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
