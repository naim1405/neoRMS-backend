import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/ApiResponse';
import { orderStatusService } from './orderStatus.service';
import { JwtPayload } from '../../types/jwt.types';

// Get order history for the requesting user (paginated)
const getUserOrders = catchAsync(async (req: any, res) => {
    const user = req.user as JwtPayload;
    const tenantId = req.tenantId as string;
    const limit = parseInt(req.query.limit as string) || 10;
    const page = parseInt(req.query.page as string) || 1;
    const status = req.query.status as any;
    const orderType = req.query.orderType as any;

    const result = await orderStatusService.getUserOrders(user, tenantId, {
        status,
        orderType,
        limit,
        page,
    });

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Orders retrieved successfully',
        meta: result.meta,
        data: result.data,
    });
});

const getRestaurantOrders = catchAsync(async (req: any, res) => {
    const result = await orderStatusService.getRestaurantOrders();
});

// Create new order
const createOrder = catchAsync(async (req: any, res) => {
    const creator = req.user as JwtPayload;
    const orderData = req.body;
    const tenantId = req.tenantId as string;

    const result = await orderStatusService.createOrder(
        creator,
        orderData,
        tenantId,
    );

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: 'Order created successfully',
        data: result,
    });
});

// Get order statistics by userID
const getOrderStatsByUserID = catchAsync(async (req: any, res) => {
    const requestingUser = req.user as JwtPayload;
    const targetUserID = req.params.userId;
    const tenantId = req.tenantId as string;

    const result = await orderStatusService.getOrderStatsByUserID(
        targetUserID,
        requestingUser,
        tenantId,
    );

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Order statistics retrieved successfully',
        data: result,
    });
});

// Track order status in steps (0-5)
const trackOrder = catchAsync(async (req: any, res) => {
    const { orderId } = req.params;
    const user = req.user as JwtPayload;
    const tenantId = req.tenantId as string;

    const result = await orderStatusService.trackOrder(orderId, user, tenantId);

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
    const tenantId = req.tenantId as string;

    const result = await orderStatusService.getOrderById(
        orderId,
        user,
        tenantId,
    );

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Order retrieved successfully',
        data: result,
    });
});

// PUT/orders/:orderId/status
const updateOrderStatus = catchAsync(async (req: any, res) => {
    const { orderId } = req.params;
    const user = req.user as JwtPayload;
    const { status } = req.body;
    const tenantId = req.tenantId as string;

    const result = await orderStatusService.updateOrderStatus(
        orderId,
        user,
        status,
        tenantId,
    );

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Order status updated successfully',
        data: result,
    });
});

// update order details (items, total price, payment method, notes, etc.)

const updateOrder = catchAsync(async (req: any, res) => {
    const { orderId } = req.params;
    const requestingUser = req.user as JwtPayload;
    const updateData = req.body;
    const tenantId = req.tenantId as string;

    const result = await orderStatusService.updateOrder(
        orderId,
        requestingUser,
        updateData,
        tenantId,
    );

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Order updated successfully',
        data: result,
    });
});

// soft Delete order- update isDeleted flag to true
const deleteOrder = catchAsync(async (req: any, res) => {
    const { orderId } = req.params;
    const requestingUser = req.user as JwtPayload;
    const tenantId = req.tenantId as string;

    await orderStatusService.deleteOrder(orderId, requestingUser, tenantId);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Order deleted successfully',
    });
});

// Hard delete order
const hardDeleteOrder = catchAsync(async (req: any, res) => {
    const { orderId } = req.params;
    const requestingUser = req.user as JwtPayload;
    const tenantId = req.tenantId as string;

    await orderStatusService.hardDeleteOrder(orderId, requestingUser, tenantId);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Order permanently deleted successfully',
    });
});

export const orderStatusController = {
    getOrderStatsByUserID,
    trackOrder,
    getOrderById,
    updateOrderStatus,
    updateOrder,
    deleteOrder,
    createOrder,
    hardDeleteOrder,
    getUserOrders,
    getRestaurantOrders,
};
