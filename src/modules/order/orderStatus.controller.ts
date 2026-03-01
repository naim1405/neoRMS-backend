import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/ApiResponse';
import { orderStatusService } from './orderStatus.service';
import { JwtPayload } from '../../types/jwt.types';

// Create new order
const createOrder = catchAsync(async (req: any, res) => {
    const creator = req.user as JwtPayload;
    const orderData = req.body; // order data has customerID along with others

    // TODO:
    // [] Order data validator
    // [] remove tenentID check
    // [] pass full creator
    // [] restaurent ID ()
    // [] get tenant Id of restaurant and send as the tenant id of the order

    const result = await orderStatusService.createOrder(
        creator.id,
        creator.tenantId,
        creator.role,
        orderData,
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

    const result = await orderStatusService.getOrderStatsByUserID(
        targetUserID,
        requestingUser,
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

    const result = await orderStatusService.trackOrder(orderId, user);

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

    const result = await orderStatusService.getOrderById(orderId, user);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Order retrieved successfully',
        data: result,
    });
});

// Get orders by status and order type
// GET /orders/status/:status?limit=10&page=1&orderType=DINE_IN
const getOrderByStatusAndOrderType = catchAsync(async (req: any, res) => {
    const user = req.user as JwtPayload;

    const { status } = req.params;

    const limit = parseInt(req.query.limit as string) || 10;
    const page = parseInt(req.query.page as string) || 1;
    const orderType = req.query.orderType as any;

    const result = await orderStatusService.getOrderByStatusAndOrderType(
        user.id,
        user.role,
        user.tenantId,
        status as any,
        limit,
        page,
        orderType,
    );

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Orders retrieved successfully',
        meta: result.meta,
        data: result.data,
    });
});

// PUT/orders/:orderId/status
const updateOrderStatus = catchAsync(async (req: any, res) => {
    const { orderId } = req.params;
    const user = req.user as JwtPayload;
    const { status } = req.body;

    const result = await orderStatusService.updateOrderStatus(
        orderId,
        user,
        status,
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

    const result = await orderStatusService.updateOrder(
        orderId,
        requestingUser,
        updateData,
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

    await orderStatusService.deleteOrder(orderId, requestingUser);

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

    await orderStatusService.hardDeleteOrder(orderId, requestingUser);

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
    getOrderByStatusAndOrderType,
};
