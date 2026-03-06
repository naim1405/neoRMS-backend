import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/ApiResponse';
import { orderStatusService } from './order.service';
import { JwtPayload } from '../../types/jwt.types';
import pick from '../../utils/pick';
import { paginationFields } from '../../const';
import httpStatus from 'http-status';
import { emitSocketEvent, SOCKET_NAMESPACES } from '../../sockets';
import {
    ChefSocketEventEnum,
    CustomerSocketEventEnum,
    WaiterSocketEventEnum,
} from '../../sockets/socket.types';
import { OrderStatus } from '@prisma/client';

// Get order history for the requesting customer (paginated)
const getCustomerOrders = catchAsync(async (req: any, res) => {
    const user = req.user as JwtPayload;
    const tenantId = req.tenantId as string;
    const options = pick(req.query, paginationFields);
    const filters = pick(req.query, ['status', 'orderType']);

    const result = await orderStatusService.getCustomerOrders(
        user,
        tenantId,
        filters,
        options,
    );

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Orders retrieved successfully',
        meta: result.meta,
        data: result.data,
    });
});

const getRestaurantOrders = catchAsync(async (req: any, res) => {
    const tenantId = req.tenantId as string;
    const { restaurantId } = req.params;
    const options = pick(req.query, paginationFields);
    const filters = pick(req.query, ['status', 'orderType']);
    const result = await orderStatusService.getRestaurantOrders(
        tenantId,
        restaurantId,
        filters,
        options,
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Restaurant Orders retrieved successfully',
        meta: result.meta,
        data: result.data,
    });
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

    emitSocketEvent(
        req,
        SOCKET_NAMESPACES.WAITER,
        tenantId,
        WaiterSocketEventEnum.ORDER_PLACED_EVENT,
        {
            orderId: result.id,
        },
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

    if (status === OrderStatus.CONFIRMED) {
        //emit chef socket event
        emitSocketEvent(
            req,
            SOCKET_NAMESPACES.CHEF,
            tenantId,
            ChefSocketEventEnum.ORDER_CONFIRMED_EVENT,
            {
                orderId: result.id,
            },
        );

        // notify other waiters about the confirmed order
        emitSocketEvent(
            req,
            SOCKET_NAMESPACES.WAITER,
            tenantId,
            WaiterSocketEventEnum.ORDER_CONFIRMATION_EVENT,
            {
                orderId: result.id,
                waiterId: user.id,
            },
        );

        emitSocketEvent(
            req,
            SOCKET_NAMESPACES.CUSTOMER,
            result.customerId,
            CustomerSocketEventEnum.ORDER_STATUS_UPDATED_EVENT,
            {
                orderId: result.id,
                status: result.status,
            },
        );
    } else if (status === OrderStatus.PREPARING) {
        // emit chef socket event
        emitSocketEvent(
            req,
            SOCKET_NAMESPACES.CHEF,
            tenantId,
            ChefSocketEventEnum.ORDER_IN_PROGRESS_EVENT,
            {
                orderId: result.id,
                chefId: user.id,
            },
        );

        emitSocketEvent(
            req,
            SOCKET_NAMESPACES.CUSTOMER,
            result.customerId,
            CustomerSocketEventEnum.ORDER_STATUS_UPDATED_EVENT,
            {
                orderId: result.id,
                status: result.status,
            },
        );
    } else if (status === OrderStatus.READY) {
        //emit waiter socket event
        //
        emitSocketEvent(
            req,
            SOCKET_NAMESPACES.WAITER,
            tenantId,
            WaiterSocketEventEnum.ORDER_READY_EVENT,
            {
                orderId: result.id,
            },
        );

        emitSocketEvent(
            req,
            SOCKET_NAMESPACES.CUSTOMER,
            result.customerId,
            CustomerSocketEventEnum.ORDER_STATUS_UPDATED_EVENT,
            {
                orderId: result.id,
                status: result.status,
            },
        );
    } else if (status === OrderStatus.DELIVERED) {
        // emit same delivered event for both DELIVERED and COMPLETED resulting states
        emitSocketEvent(
            req,
            SOCKET_NAMESPACES.CHEF,
            tenantId,
            ChefSocketEventEnum.ORDER_DELIVERED_EVENT,
            {
                orderId: result.id,
            },
        );

        emitSocketEvent(
            req,
            SOCKET_NAMESPACES.WAITER,
            tenantId,
            WaiterSocketEventEnum.ORDER_DELIVERED_EVENT,
            {
                orderId: result.id,
            },
        );

        emitSocketEvent(
            req,
            SOCKET_NAMESPACES.CUSTOMER,
            result.customerId,
            CustomerSocketEventEnum.ORDER_STATUS_UPDATED_EVENT,
            {
                orderId: result.id,
                status: result.status,
            },
        );
    } else if (status === OrderStatus.CANCELLED) {
        emitSocketEvent(
            req,
            SOCKET_NAMESPACES.CHEF,
            tenantId,
            ChefSocketEventEnum.ORDER_CANCELLED_EVENT,
            {
                orderId: result.id,
                cancelledBy: user.id,
            },
        );

        emitSocketEvent(
            req,
            SOCKET_NAMESPACES.WAITER,
            tenantId,
            WaiterSocketEventEnum.ORDER_CANCELLED_EVENT,
            {
                orderId: result.id,
                cancelledBy: user.id,
            },
        );

        emitSocketEvent(
            req,
            SOCKET_NAMESPACES.CUSTOMER,
            result.customerId,
            CustomerSocketEventEnum.ORDER_STATUS_UPDATED_EVENT,
            {
                orderId: result.id,
                status: result.status,
            },
        );
    }

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
    getCustomerOrders,
    getRestaurantOrders,
};
