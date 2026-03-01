import httpstatus from 'http-status';
import sendResponse from '../../utils/ApiResponse';
import catchAsync from '../../utils/catchAsync';
import { inventoryService } from './inventory.service';
// req.user and req.tenantId are guaranteed by verifyJwt + verifyTenantAccess middlewares

const getAllInventoryIngredients = catchAsync(async (req: any, res) => {
    const result = await inventoryService.getAllInventoryIngredients();
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Inventory ingredients fetched successfully',
        data: result,
    });
});

const getRestaurantInventory = catchAsync(async (req: any, res) => {
    const result = await inventoryService.getRestaurantInventory(
        req.params.restaurantId,
        req.tenantId,
    );
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Restaurant inventory fetched successfully',
        data: result,
    });
});

const createRestaurantInventory = catchAsync(async (req: any, res) => {
    const result = await inventoryService.createRestaurantInventory(
        req.params.restaurantId,
        req.tenantId,
        req.body,
        req.user.id,
    );
    sendResponse(res, {
        statusCode: httpstatus.CREATED,
        success: true,
        message: 'Restaurant inventory entry created successfully',
        data: result,
    });
});

const updateRestaurantInventory = catchAsync(async (req: any, res) => {
    const result = await inventoryService.updateRestaurantInventory(
        req.params.restaurantInventoryId,
        req.params.restaurantId,
        req.tenantId,
        req.body,
        req.user.id,
    );
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Restaurant inventory entry updated successfully',
        data: result,
    });
});

const deleteRestaurantInventory = catchAsync(async (req: any, res) => {
    await inventoryService.deleteRestaurantInventory(
        req.params.restaurantInventoryId,
        req.params.restaurantId,
        req.tenantId,
        req.user.id,
    );
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Restaurant inventory entry deleted successfully',
        data: null,
    });
});

const addQuantity = catchAsync(async (req: any, res) => {
    const result = await inventoryService.addQuantity(
        req.params.restaurantInventoryId,
        req.params.restaurantId,
        req.tenantId,
        req.body,
        req.user.id,
    );
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Quantity added successfully',
        data: result,
    });
});

const subtractQuantity = catchAsync(async (req: any, res) => {
    const result = await inventoryService.subtractQuantity(
        req.params.restaurantInventoryId,
        req.params.restaurantId,
        req.tenantId,
        req.body,
        req.user.id,
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
