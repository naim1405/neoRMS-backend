import httpstatus from 'http-status';
import sendResponse from '../../utils/ApiResponse';
import catchAsync from '../../utils/catchAsync';
import { inventoryService } from './inventory.service';

const getAllInventoryIngredients = catchAsync(async (req, res) => {
    const result = await inventoryService.getAllInventoryIngredients();
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Inventory ingredients fetched successfully',
        data: result,
    });
});

const getRestaurantInventory = catchAsync(async (req, res) => {
    const result = await inventoryService.getRestaurantInventory(
        req.params.restaurantId as string,
    );
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Restaurant inventory fetched successfully',
        data: result,
    });
});

const createRestaurantInventory = catchAsync(async (req, res) => {
    const result = await inventoryService.createRestaurantInventory(
        req.params.restaurantId as string,
        req.body,
    );
    sendResponse(res, {
        statusCode: httpstatus.CREATED,
        success: true,
        message: 'Restaurant inventory entry created successfully',
        data: result,
    });
});

const updateRestaurantInventory = catchAsync(async (req, res) => {
    const result = await inventoryService.updateRestaurantInventory(
        req.params.restaurantInventoryId as string,
        req.params.restaurantId as string,
        req.body,
    );
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Restaurant inventory entry updated successfully',
        data: result,
    });
});

const deleteRestaurantInventory = catchAsync(async (req, res) => {
    await inventoryService.deleteRestaurantInventory(
        req.params.restaurantInventoryId as string,
        req.params.restaurantId as string,
    );
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Restaurant inventory entry deleted successfully',
        data: null,
    });
});

const addQuantity = catchAsync(async (req, res) => {
    const result = await inventoryService.addQuantity(
        req.params.restaurantInventoryId as string,
        req.params.restaurantId as string,
        req.body,
    );
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Quantity added successfully',
        data: result,
    });
});

const subtractQuantity = catchAsync(async (req, res) => {
    const result = await inventoryService.subtractQuantity(
        req.params.restaurantInventoryId as string,
        req.params.restaurantId as string,
        req.body,
    );
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Quantity subtracted successfully',
        data: result,
    });
});

export const inventoryController = {
    getAllInventoryIngredients,
    getRestaurantInventory,
    createRestaurantInventory,
    updateRestaurantInventory,
    deleteRestaurantInventory,
    addQuantity,
    subtractQuantity,
};
