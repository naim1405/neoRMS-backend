import httpstatus from 'http-status';
import sendResponse from '../../utils/ApiResponse';
import catchAsync from '../../utils/catchAsync';
import { menuProductService } from './menuProduct.service';

const createMenuProduct = catchAsync(async (req: any, res: any) => {
    const result = await menuProductService.createMenuProduct(
        req.params.restaurantId as string,
        req.body,
        req.tenantId as string,
    );
    sendResponse(res, {
        statusCode: httpstatus.CREATED,
        success: true,
        message: 'Menu product created successfully',
        data: result,
    });
});

const updateMenuProduct = catchAsync(async (req: any, res) => {
    const result = await menuProductService.updateMenuProduct(
        req.params.menuProductId as string,
        req.params.restaurantId as string,
        req.body,
        req.tenantId as string,
    );
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Menu product updated successfully',
        data: result,
    });
});

const deleteMenuProduct = catchAsync(async (req: any, res) => {
    await menuProductService.deleteMenuProduct(
        req.params.menuProductId as string,
        req.params.restaurantId as string,
        req.tenantId as string,
    );
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Menu product deleted successfully',
        data: null,
    });
});

const getMenuProductsByRestaurant = catchAsync(async (req, res) => {
    const result = await menuProductService.getMenuProductsByRestaurant(
        req.params.restaurantId as string,
    );
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Menu products fetched successfully',
        data: result,
    });
});

const getMenuProductById = catchAsync(async (req, res) => {
    const result = await menuProductService.getMenuProductById(
        req.params.menuProductId as string,
        req.params.restaurantId as string,
    );
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Menu product fetched successfully',
        data: result,
    });
});

export const menuProductController = {
    createMenuProduct,
    updateMenuProduct,
    deleteMenuProduct,
    getMenuProductsByRestaurant,
    getMenuProductById,
};
