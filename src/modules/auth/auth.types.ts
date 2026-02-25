import { UserRole } from '@prisma/client';

export interface ILoginUser {
    email: string;
    password: string;
}

export const portalRoleMap: Record<string, UserRole[]> = {
    chef: [UserRole.CHEF],
    waiter: [UserRole.WAITER],
    customer: [UserRole.CUSTOMER],
    management: [UserRole.OWNER, UserRole.MANAGER],
};
