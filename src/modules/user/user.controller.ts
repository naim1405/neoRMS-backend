import sendResponse from '../../utils/ApiResponse';
import catchAsync from '../../utils/catchAsync';
import httpstatus from 'http-status';
import { userService } from './user.service';
import { JwtPayload } from '../../types/jwt.types';
import ApiError from '../../utils/ApiError';

const signup = catchAsync(async (req, res) => {
    const result = await userService.signup(req.body);

    sendResponse(res, {
        statusCode: httpstatus.CREATED,
        success: true,
        message: 'Account created successfully',
        data: result,
    });
});

const createManager = catchAsync(async (req: any, res) => {
    const requester = req.user as JwtPayload;
    const result = await userService.createManager(requester.id, req.body);

    sendResponse(res, {
        statusCode: httpstatus.CREATED,
        success: true,
        message: 'Manager created successfully',
        data: result,
    });
});

const createChef = catchAsync(async (req: any, res) => {
    const requester = req.user as JwtPayload;
    const result = await userService.createChef(requester.id, req.body);

    sendResponse(res, {
        statusCode: httpstatus.CREATED,
        success: true,
        message: 'Chef created successfully',
        data: result,
    });
});

const createWaiter = catchAsync(async (req: any, res) => {
    const requester = req.user as JwtPayload;
    const result = await userService.createWaiter(requester.id, req.body);

    sendResponse(res, {
        statusCode: httpstatus.CREATED,
        success: true,
        message: 'Waiter created successfully',
        data: result,
    });
});

const getMyProfile = catchAsync(async (req: any, res) => {
    const requester = req.user as JwtPayload;
    const result = await userService.getMyProfile(requester.id);

    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Profile fetched successfully',
        data: result,
    });
});

const updateMyProfile = catchAsync(async (req: any, res) => {
    const requester = req.user as JwtPayload;
    const result = await userService.updateMyProfile(requester.id, req.body);

    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Profile updated successfully',
        data: result,
    });
});

const deleteUser = catchAsync(async (req: any, res) => {
    const requester = req.user as JwtPayload;
    const { userId } = req.params;

    if (!userId) {
        throw new ApiError(httpstatus.BAD_REQUEST, 'User ID is required');
    }

    const result = await userService.deleteUser(requester, userId);

    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

const getRestaurantStaff = catchAsync(async (req: any, res) => {
    const requester = req.user as JwtPayload;
    const { restaurantId } = req.params;

    if (!restaurantId) {
        throw new ApiError(httpstatus.BAD_REQUEST, 'Restaurant ID is required');
    }

    const result = await userService.getRestaurantStaff(requester.id, restaurantId);

    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Staff fetched successfully',
        data: result,
    });
});

export const userController = {
    signup,
    createManager,
    createChef,
    createWaiter,
    getMyProfile,
    updateMyProfile,
    deleteUser,
    getRestaurantStaff,
};
