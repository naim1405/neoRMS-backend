import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/ApiResponse';
import { orderStatusService } from './orderStatus.service';
import { JwtPayload } from '../../types/jwt.types';



// Get order statistics for the current user
const getOrderStatsByUserID = catchAsync(async (req: any, res) => {
    const user = req.user as JwtPayload;
    const userIdtoFindStats = req.params.userId;

    const result = await orderStatusService.getOrderStatsByUserID(userIdtoFindStats, user.role);

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

    const result = await orderStatusService.trackOrder(orderId, user.id, user.role);

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

    const result = await orderStatusService.getOrderById(orderId, user.id, user.role);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Order retrieved successfully',
        data: result,
    });
});

// Update order status (status, payment info, delivery details, etc.)
const updateOrderStatus = catchAsync(async (req: any, res) => {
    const { orderId } = req.params;
    const user = req.user as JwtPayload;
    const { status } = req.body;

    const result = await orderStatusService.updateOrderStatus(
        orderId,
        user.id,
        user.role,
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
    const user = req.user as JwtPayload;
    const updateData = req.body;

    const result = await orderStatusService.updateOrder(
        orderId,
        user.id,
        user.role,
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

    await orderStatusService.deleteOrder(orderId, user.id, user.role);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Order deleted successfully',
    });
});

// Create new order
const createOrder = catchAsync(async (req: any, res) => {
    const user = req.user as JwtPayload;
    const orderData = req.body;

    const result = await orderStatusService.createOrder(user.id, orderData);

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: 'Order created successfully',
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

export const orderStatusController = {
    getOrderStatsByUserID,
    trackOrder,
    getOrderById,
    updateOrderStatus,
    updateOrder,
    deleteOrder,
    createOrder,
    getOrderByStatusAndOrderType,
};
