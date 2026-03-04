import httpstatus from 'http-status';
import sendResponse from '../../utils/ApiResponse';
import catchAsync from '../../utils/catchAsync';
import { tableService } from './table.service';
import { JwtPayload } from '../../types/jwt.types';

const getTablesByRestaurantID = catchAsync(async (req: any, res: any) => {
    const result = await tableService.getTablesByRestaurantID(
        req.params.restaurantId as string,
    );
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Tables fetched successfully',
        data: result,
    });
});

const createTable = catchAsync(async (req: any, res: any) => {
    const result = await tableService.createTable(
        req.body,
        req.params.restaurantId as string,
        req.tenantId as string,
    );
    sendResponse(res, {
        statusCode: httpstatus.CREATED,
        success: true,
        message: 'Table created successfully',
        data: result,
    });
});

const updateTable = catchAsync(async (req: any, res: any) => {
    const result = await tableService.updateTable(
        req.params.tableId as string,
        req.params.restaurantId as string,
        req.tenantId as string,
        req.body,
    );
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Table updated successfully',
        data: result,
    });
});

const softDeleteTable = catchAsync(async (req: any, res: any) => {
    const result = await tableService.softDeleteTable(
        req.user as JwtPayload,
        req.params.tableId as string,
        req.params.restaurantId as string,
        req.tenantId as string,
    );
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Table deleted successfully',
        data: result,
    });
});

const hardDeleteTable = catchAsync(async (req: any, res: any) => {
    const result = await tableService.hardDeleteTable(
        req.params.tableId as string,
        req.params.restaurantId as string,
        req.tenantId as string,
    );
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Table permanently deleted successfully',
        data: result,
    });
});

const createReservation = catchAsync(async (req: any, res: any) => {
    const result = await tableService.createReservation(
        req.body,
        req.params.tableId as string,
        req.user.id as string,
        req.tenantId as string,
    );
    sendResponse(res, {
        statusCode: httpstatus.CREATED,
        success: true,
        message: 'Reservation created successfully',
        data: result,
    });
});

const updateReservationDetails = catchAsync(async (req: any, res: any) => {
    const result = await tableService.updateReservationDetails(
        req.params.reservationId as string,
        req.body,
        req.user as JwtPayload,
        req.tenantId as string,
    );
    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Reservation updated successfully',
        data: result,
    });
});

export const tableController = {
    createTable,
    getTablesByRestaurantID,
    updateTable,
    softDeleteTable,
    hardDeleteTable,
    createReservation,
    updateReservationDetails,
};
