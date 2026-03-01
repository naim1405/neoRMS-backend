import { UserRole } from '@prisma/client';

export type JwtPayload = {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    iad: number;
    tenantId: string;
    exp: number;
};
