import httpstatus from 'http-status';
import sendResponse from '../../utils/ApiResponse';
import catchAsync from '../../utils/catchAsync';
import { analyticsService } from './analytics.service';
import { IAnalyticsDateRangeQuery } from './analytics.types';

// Helper to parse date-range query params
const parseDateRange = (query: any): { startDate?: Date; endDate?: Date } => ({
    ...(query.startDate && { startDate: new Date(query.startDate) }),
    ...(query.endDate && { endDate: new Date(query.endDate) }),
});

// GET /analytics
const getSummary = catchAsync(async (req: any, res) => {
    const restaurantId = req.query.restaurantId as string | undefined;
    const dateRange = parseDateRange(req.query);

    const result = await analyticsService.getSummaryAnalytics(
        req.user.id,
        restaurantId,
        dateRange,
    );

    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Analytics summary fetched successfully',
        data: result,
    });
});

// GET /analytics/dashboard/:restaurantId
const getDashboard = catchAsync(async (req: any, res) => {
    const { restaurantId } = req.params;
    const dateRange = parseDateRange(req.query);

    const result = await analyticsService.getDashboardAnalytics(restaurantId, dateRange);

    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Dashboard analytics fetched successfully',
        data: result,
    });
});

// GET /analytics/orders/:restaurantId
const getOrders = catchAsync(async (req: any, res) => {
    const { restaurantId } = req.params;
    const dateRange = parseDateRange(req.query);

    const result = await analyticsService.getOrdersAnalytics(restaurantId, dateRange);

    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Order analytics fetched successfully',
        data: result,
    });
});

// GET /analytics/menu/:restaurantId
const getMenu = catchAsync(async (req: any, res) => {
    const { restaurantId } = req.params;
    const dateRange = parseDateRange(req.query);

    const result = await analyticsService.getMenuAnalytics(restaurantId, dateRange);

    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Menu analytics fetched successfully',
        data: result,
    });
});

// GET /analytics/inventory/:restaurantId
const getInventory = catchAsync(async (req: any, res) => {
    const { restaurantId } = req.params;

    const result = await analyticsService.getInventoryAnalytics(restaurantId);

    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Inventory analytics fetched successfully',
        data: result,
    });
});

// GET /analytics/restaurants
const getRestaurants = catchAsync(async (req: any, res) => {
    const dateRange = parseDateRange(req.query);

    const result = await analyticsService.getRestaurantsAnalytics(req.user.id, dateRange);

    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Restaurant analytics fetched successfully',
        data: result,
    });
});

export const analyticsController = {
    getSummary,
    getDashboard,
    getOrders,
    getMenu,
    getInventory,
    getRestaurants,
};
