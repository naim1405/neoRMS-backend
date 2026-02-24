import jwt, { Secret, SignOptions, JwtPayload } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import config from '../config';
const generateRefreshToken = async (payload: Record<string, unknown>) => {
    const options: SignOptions = {
        algorithm: 'HS256',
        expiresIn: config.jwt.refreshExpiration as jwt.SignOptions['expiresIn'],
    };
    return jwt.sign(payload, config.jwt.refreshSecret, options);
};

const generateAccessToken = async (payload: Record<string, unknown>) => {
    const options: SignOptions = {
        algorithm: 'HS256',
        expiresIn: config.jwt.accessExpiration as jwt.SignOptions['expiresIn'],
    };
    return jwt.sign(payload, config.jwt.accessSecret, options);
};

const isPasswordMatched = async (
    plainTextPassword: string,
    hashedPassword: string,
): Promise<boolean> => {
    try {
        const match: boolean = await bcrypt.compare(
            plainTextPassword,
            hashedPassword,
        );
        return match;
    } catch (error) {
        throw new Error('Error comparing passwords');
    }
};

const hashPassword = async (password: string): Promise<string> => {
    const saltRounds: number = 10;
    try {
        const hashedPassword: string = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    } catch (error) {
        throw new Error('Error hashing password');
    }
};

const verifyAccessToken = (token: string) => {
    const verifiedToken = jwt.verify(
        token,
        config.jwt.accessSecret,
    ) as JwtPayload;
    return verifiedToken;
};

const verifyRefreshToken = (token: string) => {
    const verifiedToken = jwt.verify(
        token,
        config.jwt.refreshSecret,
    ) as JwtPayload;
    return verifiedToken;
};

export const AuthUtils = {
    generateAccessToken,
    generateRefreshToken,
    hashPassword,
    isPasswordMatched,
    verifyAccessToken,
    verifyRefreshToken,
};
