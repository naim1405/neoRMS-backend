export interface ISignupUser {
    email: string;
    fullName: string;
    password: string;
    avatar?: string;
    role: 'CUSTOMER' | 'OWNER';
}

export interface ICreateStaffUser {
    email: string;
    fullName: string;
    password: string;
    avatar?: string;
    restaurantId: string;
}

export interface IUpdateUser {
    fullName?: string;
    avatar?: string;
}
