import httpstatus from 'http-status';
import sendResponse from '../../utils/ApiResponse';
import catchAsync from '../../utils/catchAsync';
import { JwtPayload } from '../../types/jwt.types';
import pick from '../../utils/pick';
import { reviewService } from './review.service';
import { paginationFields } from '../../const';
import {
    ICreateReviewPayload,
    IManagementReviewFilters,
    IReviewPaginationOptions,
} from './review.types';

const createReview = catchAsync(async (req: any, res: any) => {
    const result = await reviewService.createReview(
        req.user as JwtPayload,
        req.body as ICreateReviewPayload,
        req.tenantId as string,
    );

    sendResponse(res, {
        statusCode: httpstatus.CREATED,
        success: true,
        message: 'Review created successfully',
        data: result,
    });
});

const getMyReviews = catchAsync(async (req: any, res: any) => {
    const options = pick(
        req.query,
        paginationFields,
    ) as IReviewPaginationOptions;
    const result = await reviewService.getMyReviews(
        req.user as JwtPayload,
        req.tenantId as string,
        options,
    );
    const { meta, data } = result;

    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'My reviews fetched successfully',
        meta,
        data,
    });
});

const getMyReviewsByOrder = catchAsync(async (req: any, res: any) => {
    const result = await reviewService.getMyReviewsByOrder(
        req.user as JwtPayload,
        req.params.orderId as string,
        req.tenantId as string,
    );

    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Order reviews fetched successfully',
        data: result,
    });
});

const getMyReviewsByMenuProduct = catchAsync(async (req: any, res: any) => {
    const result = await reviewService.getMyReviewsByMenuProduct(
        req.user as JwtPayload,
        req.params.menuProductId as string,
        req.tenantId as string,
    );

    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Menu product reviews fetched successfully',
        data: result,
    });
});

const managementGetAllReviews = catchAsync(async (req: any, res: any) => {
    const options = pick(
        req.query,
        paginationFields,
    ) as IReviewPaginationOptions;
    const filters = pick(req.query, [
        'rating',
        'customerId',
        'menuProductId',
        'orderId',
    ]) as IManagementReviewFilters;
    const result = await reviewService.managementGetAllReviews(
        req.tenantId as string,
        filters,
        options,
    );
    const { meta, data } = result;

    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'All reviews fetched successfully',
        meta,
        data,
    });
});

const managementGetReviewsByCustomer = catchAsync(
    async (req: any, res: any) => {
        const options = pick(
            req.query,
            paginationFields,
        ) as IReviewPaginationOptions;
        const result = await reviewService.managementGetReviewsByCustomer(
            req.params.customerId as string,
            req.tenantId as string,
            options,
        );
        const { meta, data } = result;

        sendResponse(res, {
            statusCode: httpstatus.OK,
            success: true,
            message: 'Customer reviews fetched successfully',
            meta,
            data,
        });
    },
);

const managementGetReviewsByMenuProduct = catchAsync(
    async (req: any, res: any) => {
        const options = pick(
            req.query,
            paginationFields,
        ) as IReviewPaginationOptions;
        const result = await reviewService.managementGetReviewsByMenuProduct(
            req.params.menuProductId as string,
            req.tenantId as string,
            options,
        );
        const { meta, data } = result;

        sendResponse(res, {
            statusCode: httpstatus.OK,
            success: true,
            message: 'Menu product reviews fetched successfully',
            meta,
            data,
        });
    },
);

const managementGetReviewsByOrder = catchAsync(async (req: any, res: any) => {
    const result = await reviewService.managementGetReviewsByOrder(
        req.params.orderId as string,
        req.tenantId as string,
    );

    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Order reviews fetched successfully',
        data: result,
    });
});

const managementGetReviewById = catchAsync(async (req: any, res: any) => {
    const result = await reviewService.managementGetReviewById(
        req.params.reviewId as string,
        req.tenantId as string,
    );

    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Review fetched successfully',
        data: result,
    });
});

const managementDeleteReview = catchAsync(async (req: any, res: any) => {
    const result = await reviewService.managementDeleteReview(
        req.params.reviewId as string,
        req.user as JwtPayload,
        req.tenantId as string,
    );

    sendResponse(res, {
        statusCode: httpstatus.OK,
        success: true,
        message: 'Review deleted successfully',
        data: result,
    });
});

export const reviewController = {
    createReview,
    getMyReviews,
    getMyReviewsByOrder,
    getMyReviewsByMenuProduct,
    managementGetAllReviews,
    managementGetReviewsByCustomer,
    managementGetReviewsByMenuProduct,
    managementGetReviewsByOrder,
    managementGetReviewById,
    managementDeleteReview,
};
