import {
    Category,
    Currency,
    DietaryTag,
    ProductStatus,
    VariantType,
} from '@prisma/client';

export interface ICreateMenuProductVariant {
    type: VariantType;
    price: number;
    discount?: number;
}

export interface ICreateMenuProductAddon {
    name: string;
    price: number;
}

export interface ICreateMenuProduct {
    productTitle: string;
    productDescription?: string;
    estimatedCookingTime?: number;
    status: ProductStatus;
    priceCurrency: Currency;
    category: Category;
    dietaryTags?: DietaryTag[];
    images?: string[];
    variants?: ICreateMenuProductVariant[];
    addons?: ICreateMenuProductAddon[];
}

export interface IUpdateMenuProduct {
    productTitle?: string;
    productDescription?: string;
    estimatedCookingTime?: number;
    status?: ProductStatus;
    priceCurrency?: Currency;
    category?: Category;
    dietaryTags?: DietaryTag[];
    images?: string[];
}

export interface IGetRecommendationPayload {
    cartItems: string[];
}
