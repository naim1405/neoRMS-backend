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
};
