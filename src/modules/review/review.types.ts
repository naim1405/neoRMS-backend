export interface ICreateReviewPayload {
    menuProductId: string;
    orderId: string;
    rating: number;
    comment?: string;
}

export interface IReviewPaginationOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface IManagementReviewFilters {
    rating?: number;
    customerId?: string;
    menuProductId?: string;
    orderId?: string;
}
