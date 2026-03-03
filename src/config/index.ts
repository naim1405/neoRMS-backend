import dotenv from 'dotenv';
import path from 'path';

const envPath = path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });

export default {
    port: process.env.PORT || 3000,
    databseUrl: process.env.DB_URI,
    env: process.env.NODE_ENV || 'development',
    jwt: {
        accessSecret: process.env.JWT_ACCESS_TOKEN_SECRET as string,
        accessExpiration: process.env.JWT_ACCESS_TOKEN_EXPIRATION as string,
        refreshSecret: process.env.JWT_REFRESH_TOKEN_SECRET as string,
        refreshExpiration: process.env.JWT_REFRESH_TOKEN_EXPIRATION as string,
    },
    appSecret: process.env.APP_SECRET as string,
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        callBackURL: process.env.GOOGLE_CALLBACK_URL as string,
    },
    sslcommerz: {
        storeId: process.env.SSL_STORE_ID as string,
        storePassword: process.env.SSL_STORE_PASSWORD as string,
        isLive: process.env.SSL_IS_LIVE === 'true',
        successUrl: process.env.SSL_SUCCESS_URL as string,
        failUrl: process.env.SSL_FAIL_URL as string,
        cancelUrl: process.env.SSL_CANCEL_URL as string,
        ipnUrl: process.env.SSL_IPN_URL as string,
    },
};
