import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/ApiResponse';
import { orderStatusService } from './orderStatus.service';
import { JwtPayload } from '../../types/jwt.types';

// Get all orders for the current user with optional filtering and pagination
const getUserOrders = catchAsync(async (req: any, res) => {
    const user = req.user as JwtPayload;
    const limit = parseInt(req.query.limit as string) || 10;
    const page = parseInt(req.query.page as string) || 1;
    const status = req.query.status as string | undefined;

    const result = await orderStatusService.getUserOrders(
        user.id,
        limit,
        page,
        status as any,
    );

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'User orders retrieved successfully',
        meta: result.meta,
        data: result.data,
    });
});

// Get order statistics for the current user
const getOrderStats = catchAsync(async (req: any, res) => {
    const user = req.user as JwtPayload;

    const result = await orderStatusService.getOrderStats(user.id);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Order statistics retrieved successfully',
        data: result,
    });
});

// Track order status in real-time
const trackOrder = catchAsync(async (req: any, res) => {
    const { orderId } = req.params;
    const user = req.user as JwtPayload;

    const result = await orderStatusService.trackOrder(orderId, user.id);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Order tracked successfully',
        data: result,
    });
});

// Get single order by ID
const getOrderById = catchAsync(async (req: any, res) => {
    const { orderId } = req.params;
    const user = req.user as JwtPayload;

    const result = await orderStatusService.getOrderById(orderId, user.id);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Order retrieved successfully',
        data: result,
    });
});

// Update order (status, payment info, delivery details, etc.)
const updateOrder = catchAsync(async (req: any, res) => {
    const { orderId } = req.params;
    const user = req.user as JwtPayload;
    const updateData = req.body;

    const result = await orderStatusService.updateOrder(
        orderId,
        user.id,
        updateData,
    );

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Order updated successfully',
        data: result,
    });
});

// Delete order
const deleteOrder = catchAsync(async (req: any, res) => {
    const { orderId } = req.params;
    const user = req.user as JwtPayload;

    await orderStatusService.deleteOrder(orderId, user.id);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Order deleted successfully',
    });
});

export const orderStatusController = {
    getUserOrders,
    getOrderStats,
    trackOrder,
    getOrderById,
    updateOrder,
    deleteOrder,
};
