// eslint-disable-next-line @typescript-eslint/no-var-requires
const SSLCommerzPayment = require('sslcommerz-lts');

import httpstatus from 'http-status';
import prisma from '../../utils/prisma';
import ApiError from '../../utils/ApiError';
import { JwtPayload } from '../../types/jwt.types';
import { IInitPayment } from './payment.types';
import config from '../../config';

const initPayment = async (payload: IInitPayment, user: JwtPayload) => {
    const order = await prisma.order.findUnique({
        where: { id: payload.orderId },
        include: {
            customer: {
                include: { user: true },
            },
            restaurant: true,
            items: true,
        },
    });

    if (!order) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Order not found');
    }

    if (order.customerId !== user.id) {
        throw new ApiError(httpstatus.FORBIDDEN, 'You are not authorized to pay for this order');
    }

    if (order.paymentStatus === 'COMPLETED') {
        throw new ApiError(httpstatus.BAD_REQUEST, 'Order has already been paid');
    }

    const customer = order.customer.user;
    const restaurant = order.restaurant;

    const data = {
        total_amount: order.totalPrice,
        currency: 'BDT',
        tran_id: order.id,
        success_url: `${config.sslcommerz.successUrl}?orderId=${order.id}`,
        fail_url: `${config.sslcommerz.failUrl}?orderId=${order.id}`,
        cancel_url: `${config.sslcommerz.cancelUrl}?orderId=${order.id}`,
        ipn_url: config.sslcommerz.ipnUrl,
        shipping_method: 'NO',
        product_name: `Order from ${restaurant.name}`,
        product_category: 'Food',
        product_profile: 'general',
        cus_name: customer.fullName,
        cus_email: customer.email,
        cus_add1: restaurant.location || 'N/A',
        cus_add2: restaurant.location || 'N/A',
        cus_city: 'Dhaka',
        cus_state: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        cus_phone: restaurant.contactInfo || '01711111111',
        cus_fax: restaurant.contactInfo || '01711111111',
        ship_name: customer.fullName,
        ship_add1: restaurant.location || 'N/A',
        ship_add2: restaurant.location || 'N/A',
        ship_city: 'Dhaka',
        ship_state: 'Dhaka',
        ship_postcode: 1000,
        ship_country: 'Bangladesh',
    };

    const sslcz = new SSLCommerzPayment(
        config.sslcommerz.storeId,
        config.sslcommerz.storePassword,
        config.sslcommerz.isLive,
    );

    const apiResponse = await sslcz.init(data);

    const gatewayUrl = apiResponse?.GatewayPageURL;
    if (!gatewayUrl) {
        throw new ApiError(httpstatus.BAD_GATEWAY, 'Failed to initialize payment gateway');
    }

    return { gatewayUrl };
};

const postIPN = async (ipnData: any) => {
    // IPN acts as a fallback - same logic as success
    if (ipnData.status === 'VALID' || ipnData.status === 'VALIDATED') {
        await prisma.order.update({
            where: { id: ipnData.tran_id },
            data: { paymentStatus: 'COMPLETED' },
        });
    } else {
        await prisma.order.update({
            where: { id: ipnData.tran_id },
            data: { paymentStatus: 'FAILED' },
        });
    }
    return { received: true };
};

const paymentSuccess = async (body: any) => {
    const orderId = body.tran_id;
    if (!orderId) {
        throw new ApiError(httpstatus.BAD_REQUEST, 'Missing transaction ID');
    }

    const sslcz = new SSLCommerzPayment(
        config.sslcommerz.storeId,
        config.sslcommerz.storePassword,
        config.sslcommerz.isLive,
    );

    // Verify the payment is genuine — but let IPN own the DB write
    const validationResponse = await sslcz.validate({ val_id: body.val_id });
    if (validationResponse.status !== 'VALID' && validationResponse.status !== 'VALIDATED') {
        throw new ApiError(httpstatus.BAD_REQUEST, 'Payment validation failed');
    }

    // Just return current order state — IPN has already updated or will shortly
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    return order;
};

const paymentFail = async (body: any) => {
    const orderId = body.tran_id;
    if (!orderId) {
        throw new ApiError(httpstatus.BAD_REQUEST, 'Missing transaction ID');
    }

    // IPN owns the DB write — just return current state
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    return order;
};

const paymentCancel = async (body: any) => {
    const orderId = body.tran_id;
    if (!orderId) {
        throw new ApiError(httpstatus.BAD_REQUEST, 'Missing transaction ID');
    }

    // IPN owns the DB write — just return current state
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    return order;
};

export const paymentService = { initPayment, postIPN, paymentSuccess, paymentFail, paymentCancel };
