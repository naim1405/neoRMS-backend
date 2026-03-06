import { emitSocketEvent } from '../../sockets';
import {
    SOCKET_NAMESPACES,
    ChefSocketEventEnum,
    CustomerSocketEventEnum,
    WaiterSocketEventEnum,
} from '../../sockets/socket.types';
import sendResponse from '../../utils/ApiResponse';
import catchAsync from '../../utils/catchAsync';
import httpstatus from 'http-status';
import prisma from '../../utils/prisma';
import { aiService } from '../aiService';

const customerPlaceOrder = catchAsync(async (req, res) => {
    const restaurantId = req.body.restaurantId;
    emitSocketEvent(
        req,
        SOCKET_NAMESPACES.WAITER,
        restaurantId,
        WaiterSocketEventEnum.ORDER_PLACED_EVENT,
        {
            orderId: '123',
            message: 'New order placed by customer. Heres order ID: 123',
        },
    );
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Order Placed Successfully',
        data: 'order received',
    });
});

const customerCancelOrder = catchAsync(async (req, res) => {
    const restaurantId = req.body.restaurantId;
    emitSocketEvent(
        req,
        SOCKET_NAMESPACES.WAITER,
        restaurantId,
        WaiterSocketEventEnum.ORDER_CANCELLED_EVENT,
        {
            orderId: '123',
            message: 'Order Cancelled.Customer changed their mind',
        },
    );
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Order Cancelled Successfully',
        data: 'order cancelled',
    });
});

const chefCancelOrder = catchAsync(async (req, res) => {
    const restaurantId = req.body.restaurantId;
    emitSocketEvent(
        req,
        SOCKET_NAMESPACES.WAITER,
        restaurantId,
        WaiterSocketEventEnum.ORDER_CANCELLED_BY_CHEF_EVENT,
        {
            orderId: '123',
            message: 'Order cancelled by chef.',
        },
    );
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Chef cancelled the order',
        data: 'order cancelled by chef',
    });
});

const chefOrderReady = catchAsync(async (req, res) => {
    const restaurantId = req.body.restaurantId;
    emitSocketEvent(
        req,
        SOCKET_NAMESPACES.WAITER,
        restaurantId,
        WaiterSocketEventEnum.ORDER_READY_EVENT,
        {
            orderId: '123',
            message: 'Order is ready for delivery.',
        },
    );
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Order is ready',
        data: 'order ready',
    });
});

const waiterConfirmOrder = catchAsync(async (req, res) => {
    const restaurantId = req.body.restaurantId;
    emitSocketEvent(
        req,
        SOCKET_NAMESPACES.CUSTOMER,
        restaurantId,
        CustomerSocketEventEnum.ORDER_STATUS_UPDATED_EVENT,
        {
            orderId: '123',
            message: 'Your order has been confirmed by the waiter.',
        },
    );
    emitSocketEvent(
        req,
        SOCKET_NAMESPACES.CHEF,
        restaurantId,
        ChefSocketEventEnum.ORDER_CONFIRMED_EVENT,
        {
            orderId: '123',
            message: 'Order confirmed. You can start working on it now.',
        },
    );
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Order confirmed by waiter',
        data: 'order confirmed',
    });
});

const chefAcceptOrder = catchAsync(async (req, res) => {
    const restaurantId = req.body.restaurantId;
    emitSocketEvent(
        req,
        SOCKET_NAMESPACES.WAITER,
        restaurantId,
        WaiterSocketEventEnum.ORDER_UPDATED_EVENT,
        {
            orderId: '123',
            message: 'Chef has accepted the order and is working on it.',
        },
    );

    emitSocketEvent(
        req,
        SOCKET_NAMESPACES.CUSTOMER,
        restaurantId,
        CustomerSocketEventEnum.ORDER_STATUS_UPDATED_EVENT,
        {
            orderId: '123',
            message: 'Your order has been confirmed by the waiter.',
        },
    );

    emitSocketEvent(
        req,
        SOCKET_NAMESPACES.CHEF,
        restaurantId,
        ChefSocketEventEnum.ORDER_IN_PROGRESS_EVENT,
        {
            orderId: '123',
            message: 'Chef has accepted the order and is working on it.',
        },
    );

    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Chef accepted the order',
        data: 'order accepted',
    });
});

const syncAiDate = catchAsync(async (req, res) => {
    const result = await prisma.order.findMany({
        select: {
            id: true,
            totalPrice: true,
            restaurantId: true,
            items: {
                select: {
                    quantity: true,
                    price: true,
                    menuItemId: true,
                },
            },
        },
    });
    const response = await aiService.sendOrderData(result);

    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'order sent to ai',
        data: response,
    });
});

export const dummyController = {
    customerPlaceOrder,
    customerCancelOrder,
    chefCancelOrder,
    chefOrderReady,
    waiterConfirmOrder,
    chefAcceptOrder,
    syncAiDate,
};
