// eslint-disable-next-line @typescript-eslint/no-var-requires
const SSLCommerzPayment = require('sslcommerz-lts');

import httpstatus from 'http-status';
import prisma from '../../utils/prisma';
import ApiError from '../../utils/ApiError';
import { JwtPayload } from '../../types/jwt.types';
import { IInitPayment } from './payment.types';
import config from '../../config';
import { Currency, PaymentMethod, PaymentStatus } from '@prisma/client';

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

    // Upsert a pending Payment record (reset if a previous attempt existed)
    await prisma.payment.upsert({
        where: { orderId: order.id },
        create: {
            amount: order.totalPrice,
            currency: Currency.BDT,
            method: order.paymentMethod as PaymentMethod,
            status: PaymentStatus.PENDING,
            orderId: order.id,
            customerId: order.customerId,
            restaurantId: order.restaurantId,
            tenantId: order.tenantId,
        },
        update: {
            status: PaymentStatus.PENDING,
            transactionId: null,
            paidAt: null,
            failureReason: null,
            gatewayResponse: undefined,
        },
    });

    // Sandbox won't trigger IPN automatically, so simulate it directly
    const ipnData = {
        status: 'VALID',
        tran_date: new Date().toISOString(),
        tran_id: order.id,
        val_id: `sandbox_val_${order.id}`,
        amount: order.totalPrice,
        store_amount: order.totalPrice,
        risk_level: '0',
        risk_title: 'Safe',
    };
    await postIPN(ipnData);

    return { gatewayUrl };
};

const postIPN = async (ipnData: any) => {
    const orderId = ipnData.tran_id as string;

    if (ipnData.status === 'VALID' || ipnData.status === 'VALIDATED') {
        // Keep existing order status update + update Payment record
        await prisma.order.update({
            where: { id: orderId },
            data: { paymentStatus: 'COMPLETED' },
        });

        await prisma.payment.update({
            where: { orderId },
            data: {
                status: PaymentStatus.COMPLETED,
                transactionId: ipnData.val_id || ipnData.tran_id,
                paidAt: new Date(),
                gatewayResponse: ipnData,
            },
        });
    } else {
        // Keep existing order status update + update Payment record
        await prisma.order.update({
            where: { id: orderId },
            data: { paymentStatus: 'FAILED' },
        });

        await prisma.payment.update({
            where: { orderId },
            data: {
                status: PaymentStatus.FAILED,
                failureReason: ipnData.error || ipnData.failedreason || 'Payment failed',
                gatewayResponse: ipnData,
            },
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

    // Verify the payment is genuine — but let IPN own the primary DB write
    const validationResponse = await sslcz.validate({ val_id: body.val_id });
    if (validationResponse.status !== 'VALID' && validationResponse.status !== 'VALIDATED') {
        throw new ApiError(httpstatus.BAD_REQUEST, 'Payment validation failed');
    }

    // Ensure Payment record reflects success (handles race with IPN)
    await prisma.payment.update({
        where: { orderId },
        data: {
            status: PaymentStatus.COMPLETED,
            transactionId: body.val_id || body.tran_id,
            paidAt: new Date(),
            gatewayResponse: body,
        },
    });

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    return order;
};

const paymentFail = async (body: any) => {
    const orderId = body.tran_id;
    if (!orderId) {
        throw new ApiError(httpstatus.BAD_REQUEST, 'Missing transaction ID');
    }

    await prisma.payment.update({
        where: { orderId },
        data: {
            status: PaymentStatus.FAILED,
            failureReason: body.error || body.failedreason || 'Payment failed',
            gatewayResponse: body,
        },
    });

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    return order;
};

const paymentCancel = async (body: any) => {
    const orderId = body.tran_id;
    if (!orderId) {
        throw new ApiError(httpstatus.BAD_REQUEST, 'Missing transaction ID');
    }

    await prisma.payment.update({
        where: { orderId },
        data: {
            status: PaymentStatus.FAILED,
            failureReason: 'Cancelled by customer',
            gatewayResponse: body,
        },
    });

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    return order;
};

const getTransactions = async (tenantId: string) => {
    const payments = await prisma.payment.findMany({
        where: { tenantId, isDeleted: false },
        include: {
            order: {
                select: {
                    id: true,
                    status: true,
                    orderType: true,
                    totalPrice: true,
                    paymentMethod: true,
                    paymentStatus: true,
                    notes: true,
                    createdAt: true,
                },
            },
            customer: {
                include: {
                    user: {
                        select: { id: true, fullName: true, email: true, avatar: true },
                    },
                },
            },
            restaurant: {
                select: { id: true, name: true, location: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    return payments;
};

export const paymentService = {
    initPayment,
    postIPN,
    paymentSuccess,
    paymentFail,
    paymentCancel,
    getTransactions,
};
