import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import httpStatus from 'http-status';
import routes from './routes';
import globalErrorHandler from './utils/globalErrorHandler';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import session from 'express-session';
import config from './config';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(
    cors({
        origin: [
            'http://localhost:8080',
            'http://localhost:3200',
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
        ],
        credentials: true,
    }),
);
app.use(express.static('public'));
app.use(
    session({
        secret: config.appSecret,
        resave: false,
        saveUninitialized: true,
    }),
);
app.use(passport.initialize());
app.use(passport.session());
passport.use(
    new GoogleStrategy(
        {
            clientID: config.google.clientId,
            clientSecret: config.google.clientSecret,
            callbackURL: config.google.callBackURL,
        },
        (accessToken, refreshToken, profile, done) => {
            console.log('🚀 accessToken : ', accessToken);
            console.log('🚀 refreshToken : ', refreshToken);
            console.log('🚀 profile : ', profile);
            return done(null, profile);
        },
    ),
);
passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user as Express.User);
});

app.use('/api', routes);

app.get('/health', (req, res) => {
    res.send('Server is working!');
});

app.use(globalErrorHandler);

app.use((req, res, next) => {
    res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: 'Not Found',
        errorMessages: [
            {
                path: req.originalUrl,
                message: 'API Not Found',
            },
        ],
    });
    next();
});

export default app;
