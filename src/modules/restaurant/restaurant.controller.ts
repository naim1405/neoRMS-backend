import httpstatus from 'http-status';
import sendResponse from '../../utils/ApiResponse';
import catchAsync from '../../utils/catchAsync';
import { restaurantService } from './restaurant.service';
import { JwtPayload } from '../../types/jwt.types';
import pick from '../../utils/pick';
import { file } from 'bun';

const createRestaurant = catchAsync(async (req, res) => {
    const result = await restaurantService.createRestaurant(
        req.body,
        req.user as JwtPayload,
    );
    sendResponse(res, {
        statusCode: httpstatus.CREATED,
        success: true,
        message: 'Restaurant created successfully',
        data: result,
    });
});

const updateRestaurant = catchAsync(async (req: any, res: any) => {
    const result = await restaurantService.updateRestaurant(
        req.params.id as string,
        req.body,
        req.tenantId as string,
    );
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Restaurant updated successfully',
        data: result,
    });
});

const getRestaurantById = catchAsync(async (req, res) => {
    const filters = pick(req.query, ['includeMenu']);
    const result = await restaurantService.getRestaurantById(
        req.params.id as string,
        filters,
    );
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Restaurant fetched successfully',
        data: result,
    });
});

const getAllRestaurants = catchAsync(async (req, res) => {
    const result = await restaurantService.getAllRestaurants();
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Restaurants fetched successfully',
        data: result,
    });
});

const getRestaurantsByUserId = catchAsync(async (req, res) => {
    const result = await restaurantService.getRestaurantsByUserId(
        req.user as JwtPayload,
    );
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'User restaurants fetched successfully',
        data: result,
    });
});

export const restaurantController = {
    createRestaurant,
    updateRestaurant,
    getRestaurantById,
    getAllRestaurants,
    getRestaurantsByUserId,
};
