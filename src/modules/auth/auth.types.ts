export interface IRegisterUser {
    email: string;
    fullName: string;
    avatar?: string;
    password: string;
}

export interface ILoginUser {
    email: string;
    password: string;
}
