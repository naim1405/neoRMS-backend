// ── Shared ────────────────────────────────────────────────────────────────────

export interface IAnalyticsDateRangeQuery {
    startDate?: string;
    endDate?: string;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface IDashboardAnalytics {
    revenue: {
        total: number;
        thisMonth: number;
    };
    orders: {
        total: number;
        thisMonth: number;
    };
    averageOrderValue: number;
    customers: {
        total: number;
        repeat: number;
    };
    staffByRole: Record<string, number>;
    lowStockAlertCount: number;
}

// ── Orders ────────────────────────────────────────────────────────────────────

export interface IOrdersByStatus {
    status: string;
    count: number;
}

export interface IOrderVolumeByDate {
    date: string;
    count: number;
    revenue: number;
}

export interface IRevenueByPaymentMethod {
    paymentMethod: string;
    total: number;
    count: number;
}

export interface IOrdersAnalytics {
    byStatus: IOrdersByStatus[];
    volumeByDate: IOrderVolumeByDate[];
    averageEstimatedDeliveryTime: number | null;
    fulfillmentRate: number;
    revenueByPaymentMethod: IRevenueByPaymentMethod[];
}

// ── Menu ──────────────────────────────────────────────────────────────────────

export interface IBestSellingItem {
    menuProductId: string;
    name: string;
    totalQuantitySold: number;
    totalRevenue: number;
}

export interface ICategoryBreakdown {
    category: string;
    totalQuantitySold: number;
    totalRevenue: number;
}

export interface IProductByStatus {
    status: string;
    count: number;
}

export interface IDietaryTagBreakdown {
    tag: string;
    count: number;
}

export interface ITopRatedProduct {
    id: string;
    productTitle: string;
    userRating: number | null;
    aiRating: number | null;
    reviewCount: number;
}

export interface IRatingDistribution {
    star: number;
    count: number;
}

export interface IMenuAnalytics {
    bestSellingItems: IBestSellingItem[];
    topRevenueProducts: IBestSellingItem[];
    categoryBreakdown: ICategoryBreakdown[];
    productsByStatus: IProductByStatus[];
    dietaryTagBreakdown: IDietaryTagBreakdown[];
    topRatedProducts: ITopRatedProduct[];
    ratingDistribution: IRatingDistribution[];
}

// ── Inventory ─────────────────────────────────────────────────────────────────

export interface ILowStockItem {
    id: string;
    ingredientName: string;
    unit: string;
    availableQuantity: number;
    thresholdQuantity: number | null;
}

export interface IInventoryAnalytics {
    totalIngredientCount: number;
    lowStockCount: number;
    lowStockItems: ILowStockItem[];
    mostUsedIngredients: { ingredientName: string; usedInProducts: number }[];
}

// ── Restaurants (Owner) ───────────────────────────────────────────────────────

export interface IRestaurantSummary {
    restaurantId: string;
    restaurantName: string;
    totalRevenue: number;
    totalOrders: number;
    menuProductCount: number;
    staffCount: number;
    lowStockCount: number;
}

export interface IRestaurantsAnalytics {
    restaurants: IRestaurantSummary[];
    bestPerforming: IRestaurantSummary | null;
    worstPerforming: IRestaurantSummary | null;
}

// ── Summary (/analytics) ──────────────────────────────────────────────────────

export interface IAnalyticsSummary {
    totalRevenue: number;
    totalOrders: number;
    topProduct: string | null;
    lowStockCount: number;
    totalRestaurants: number;
    totalStaff: number;
}
