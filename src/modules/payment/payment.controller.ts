import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/ApiResponse';
import httpStatus from 'http-status';
import { JwtPayload } from '../../types/jwt.types';
import { paymentService } from './payment.service';

const initPayment = catchAsync(async (req, res) => {
    const result = await paymentService.initPayment(
        req.body,
        req.user as JwtPayload,
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Payment initialized successfully',
        data: result,
    });

});

const postIPN = catchAsync(async (req, res) => {
    let ipnData = req.body;
    ipnData.tran_date = new Date(ipnData.tran_date);
    ipnData.amount = Number(ipnData.amount);
    ipnData.store_amount = Number(ipnData.store_amount);

    const result = await paymentService.postIPN(ipnData);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'IPN Received successfully',
        data: result,
    });
});

const paymentSuccess = catchAsync(async (req, res) => {
    const result = await paymentService.paymentSuccess(req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Payment completed successfully',
        data: result,
    });
});

const paymentFail = catchAsync(async (req, res) => {
    const result = await paymentService.paymentFail(req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: false,
        message: 'Payment failed',
        data: result,
    });
});

const paymentCancel = catchAsync(async (req, res) => {
    const result = await paymentService.paymentCancel(req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: false,
        message: 'Payment cancelled',
        data: result,
    });
});

const getTransactions = catchAsync(async (req, res) => {
    const result = await paymentService.getTransactions((req as any).tenantId as string);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Transactions fetched successfully',
        data: result,
    });
});

export const paymentController = {
    initPayment,
    postIPN,
    paymentSuccess,
    paymentFail,
    paymentCancel,
    getTransactions,
};