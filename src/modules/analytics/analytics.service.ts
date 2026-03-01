import prisma from '../../utils/prisma';
import ApiError from '../../utils/ApiError';
import httpstatus from 'http-status';
import {
    IDashboardAnalytics,
    IOrdersAnalytics,
    IMenuAnalytics,
    IInventoryAnalytics,
    IRestaurantsAnalytics,
    IAnalyticsSummary,
} from './analytics.types';

// ── Helpers ───────────────────────────────────────────────────────────────────

const db = prisma as any;

interface IDateRange {
    startDate?: Date;
    endDate?: Date;
}

const buildDateFilter = ({ startDate, endDate }: IDateRange) => {
    if (!startDate && !endDate) return undefined;
    return {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
    };
};

const assertRestaurantExists = async (restaurantId: string, tenantId: string) => {
    const restaurant = await prisma.restaurant.findFirst({
        where: { id: restaurantId, tenantId, isDeleted: false },
    });
    if (!restaurant) {
        throw new ApiError(httpstatus.NOT_FOUND, 'Restaurant not found');
    }
    return restaurant;
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

const getDashboardAnalytics = async (
    restaurantId: string,
    tenantId: string,
    dateRange: IDateRange,
): Promise<IDashboardAnalytics> => {
    await assertRestaurantExists(restaurantId, tenantId);

    const dateFilter = buildDateFilter(dateRange);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // All-time and this-month orders for the restaurant via OrderItems
    const [allOrders, thisMonthOrders] = await Promise.all([
        db.order.findMany({
            where: {
                items: { some: { menuItem: { restaurantId } } },
                status: 'DELIVERED',
                ...(dateFilter && { createdAt: dateFilter }),
            },
            select: { totalPrice: true, userId: true },
        }),
        db.order.findMany({
            where: {
                items: { some: { menuItem: { restaurantId } } },
                status: 'DELIVERED',
                createdAt: { gte: startOfMonth, lte: endOfMonth },
            },
            select: { totalPrice: true },
        }),
    ]);

    const totalRevenue: number = allOrders.reduce(
        (sum: number, o: any) => sum + o.totalPrice,
        0,
    );
    const thisMonthRevenue: number = thisMonthOrders.reduce(
        (sum: number, o: any) => sum + o.totalPrice,
        0,
    );

    const totalOrderCount: number = allOrders.length;
    const thisMonthOrderCount: number = thisMonthOrders.length;
    const averageOrderValue = totalOrderCount > 0 ? totalRevenue / totalOrderCount : 0;

    // Unique customers
    const uniqueCustomerIds = new Set<string>(allOrders.map((o: any) => o.userId));
    const customerOrderCounts = allOrders.reduce((acc: Record<string, number>, o: any) => {
        acc[o.userId] = (acc[o.userId] || 0) + 1;
        return acc;
    }, {});
    const repeatCustomers = Object.values(customerOrderCounts).filter((c) => (c as number) > 1).length;

    // Staff by role
    const [chefCount, waiterCount, managerCount] = await Promise.all([
        prisma.chef.count({ where: { restaurantId, tenantId, isDeleted: false } }),
        prisma.waiter.count({ where: { restaurantId, tenantId, isDeleted: false } }),
        prisma.manager.count({ where: { restaurantId, tenantId, isDeleted: false } }),
    ]);
    const staffByRole: Record<string, number> = {
        CHEF: chefCount,
        WAITER: waiterCount,
        MANAGER: managerCount,
    };

    // Low stock count — Prisma doesn't support column-to-column comparisons,
    // so we fetch and filter in memory
    const allInventory = await prisma.restaurantInventory.findMany({
        where: { restaurantId, tenantId, thresholdQuantity: { gt: 0 }, isDeleted: false },
        select: { availableQuantity: true, thresholdQuantity: true },
    });
    const lowStockAlertCount = allInventory.filter(
        (inv) => inv.availableQuantity <= inv.thresholdQuantity,
    ).length;

    return {
        revenue: { total: totalRevenue, thisMonth: thisMonthRevenue },
        orders: { total: totalOrderCount, thisMonth: thisMonthOrderCount },
        averageOrderValue,
        customers: { total: uniqueCustomerIds.size, repeat: repeatCustomers },
        staffByRole,
        lowStockAlertCount,
    };
};

// ── Orders ────────────────────────────────────────────────────────────────────

const getOrdersAnalytics = async (
    restaurantId: string,
    tenantId: string,
    dateRange: IDateRange,
): Promise<IOrdersAnalytics> => {
    await assertRestaurantExists(restaurantId, tenantId);

    const dateFilter = buildDateFilter(dateRange);

    const orders = await db.order.findMany({
        where: {
            items: { some: { menuItem: { restaurantId } } },
            ...(dateFilter && { createdAt: dateFilter }),
        },
        select: {
            status: true,
            totalPrice: true,
            paymentMethod: true,
            estimatedDeliveryTimeInMinutes: true,
            createdAt: true,
        },
    });

    // Orders by status
    const statusMap: Record<string, number> = {};
    orders.forEach((o: any) => {
        statusMap[o.status] = (statusMap[o.status] || 0) + 1;
    });
    const byStatus = Object.entries(statusMap).map(([status, count]) => ({
        status,
        count: count as number,
    }));

    // Volume by date (group by yyyy-mm-dd)
    const dateMap: Record<string, { count: number; revenue: number }> = {};
    orders.forEach((o: any) => {
        const day = new Date(o.createdAt).toISOString().split('T')[0];
        if (!dateMap[day]) dateMap[day] = { count: 0, revenue: 0 };
        dateMap[day].count += 1;
        if (o.status === 'DELIVERED') dateMap[day].revenue += o.totalPrice;
    });
    const volumeByDate = Object.entries(dateMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, val]) => ({ date, ...val }));

    // Avg delivery time
    const deliveryTimes = orders
        .map((o: any) => o.estimatedDeliveryTimeInMinutes)
        .filter((t: any) => t !== null && t !== undefined);
    const averageEstimatedDeliveryTime =
        deliveryTimes.length > 0
            ? deliveryTimes.reduce((a: number, b: number) => a + b, 0) / deliveryTimes.length
            : null;

    // Fulfillment rate
    const delivered = orders.filter((o: any) => o.status === 'DELIVERED').length;
    const cancelled = orders.filter((o: any) => o.status === 'CANCELLED').length;
    const relevantTotal = delivered + cancelled;
    const fulfillmentRate = relevantTotal > 0 ? (delivered / relevantTotal) * 100 : 0;

    // Revenue by payment method
    const paymentMap: Record<string, { total: number; count: number }> = {};
    orders
        .filter((o: any) => o.status === 'DELIVERED')
        .forEach((o: any) => {
            const method = o.paymentMethod || 'UNKNOWN';
            if (!paymentMap[method]) paymentMap[method] = { total: 0, count: 0 };
            paymentMap[method].total += o.totalPrice;
            paymentMap[method].count += 1;
        });
    const revenueByPaymentMethod = Object.entries(paymentMap).map(([paymentMethod, val]) => ({
        paymentMethod,
        total: val.total,
        count: val.count,
    }));

    return {
        byStatus,
        volumeByDate,
        averageEstimatedDeliveryTime,
        fulfillmentRate: Math.round(fulfillmentRate * 100) / 100,
        revenueByPaymentMethod,
    };
};

// ── Menu ──────────────────────────────────────────────────────────────────────

const getMenuAnalytics = async (
    restaurantId: string,
    tenantId: string,
    dateRange: IDateRange,
): Promise<IMenuAnalytics> => {
    await assertRestaurantExists(restaurantId, tenantId);

    const dateFilter = buildDateFilter(dateRange);

    // Fetch order items for this restaurant within date range
    const orderItems = await db.orderItem.findMany({
        where: {
            order: {
                status: 'DELIVERED',
                items: { some: { menuItem: { restaurantId } } },
                ...(dateFilter && { createdAt: dateFilter }),
            },
            menuItem: { restaurantId },
        },
        select: {
            menuItemId: true,
            name: true,
            quantity: true,
            price: true,
            menuItem: {
                select: { category: true, dietaryTags: true },
            },
        },
    });

    // Aggregate product-level stats
    const productMap: Record<
        string,
        { name: string; totalQuantitySold: number; totalRevenue: number }
    > = {};
    orderItems.forEach((item: any) => {
        if (!productMap[item.menuItemId]) {
            productMap[item.menuItemId] = {
                name: item.name,
                totalQuantitySold: 0,
                totalRevenue: 0,
            };
        }
        productMap[item.menuItemId].totalQuantitySold += item.quantity;
        productMap[item.menuItemId].totalRevenue += item.price * item.quantity;
    });

    const productList = Object.entries(productMap).map(([menuProductId, val]) => ({
        menuProductId,
        ...val,
    }));

    const bestSellingItems = [...productList]
        .sort((a, b) => b.totalQuantitySold - a.totalQuantitySold)
        .slice(0, 10);

    const topRevenueProducts = [...productList]
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10);

    // Category breakdown
    const categoryMap: Record<string, { totalQuantitySold: number; totalRevenue: number }> = {};
    orderItems.forEach((item: any) => {
        const cat = item.menuItem?.category || 'UNKNOWN';
        if (!categoryMap[cat]) categoryMap[cat] = { totalQuantitySold: 0, totalRevenue: 0 };
        categoryMap[cat].totalQuantitySold += item.quantity;
        categoryMap[cat].totalRevenue += item.price * item.quantity;
    });
    const categoryBreakdown = Object.entries(categoryMap).map(([category, val]) => ({
        category,
        ...val,
    }));

    // Products by status
    const menuProducts = await prisma.menuProduct.findMany({
        where: { restaurantId, tenantId, isDeleted: false },
        select: { status: true },
    });
    const statusMap: Record<string, number> = {};
    menuProducts.forEach(({ status }) => {
        statusMap[status] = (statusMap[status] || 0) + 1;
    });
    const productsByStatus = Object.entries(statusMap).map(([status, count]) => ({
        status,
        count,
    }));

    // Dietary tag breakdown (from menu products, not orders)
    const allMenuProducts = await prisma.menuProduct.findMany({
        where: { restaurantId, tenantId, isDeleted: false },
        select: { dietaryTags: true },
    });
    const tagMap: Record<string, number> = {};
    allMenuProducts.forEach(({ dietaryTags }) => {
        dietaryTags.forEach((tag) => {
            tagMap[tag] = (tagMap[tag] || 0) + 1;
        });
    });
    const dietaryTagBreakdown = Object.entries(tagMap).map(([tag, count]) => ({
        tag,
        count,
    }));

    // Top rated products
    const ratedProducts = await prisma.menuProduct.findMany({
        where: { restaurantId, tenantId, userRating: { not: null }, isDeleted: false },
        select: {
            id: true,
            productTitle: true,
            userRating: true,
            aiRating: true,
            _count: { select: { reviews: true } },
        },
        orderBy: { userRating: 'desc' },
        take: 10,
    });
    const topRatedProducts = ratedProducts.map((p) => ({
        id: p.id,
        productTitle: p.productTitle,
        userRating: p.userRating,
        aiRating: p.aiRating,
        reviewCount: p._count.reviews,
    }));

    // Rating distribution
    const reviews = await prisma.review.findMany({
        where: { menuProduct: { restaurantId } },
        select: { rating: true },
    });
    const ratingBuckets: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(({ rating }) => {
        const star = Math.round(rating);
        if (star >= 1 && star <= 5) ratingBuckets[star] += 1;
    });
    const ratingDistribution = Object.entries(ratingBuckets).map(([star, count]) => ({
        star: Number(star),
        count,
    }));

    return {
        bestSellingItems,
        topRevenueProducts,
        categoryBreakdown,
        productsByStatus,
        dietaryTagBreakdown,
        topRatedProducts,
        ratingDistribution,
    };
};

// ── Inventory ─────────────────────────────────────────────────────────────────

const getInventoryAnalytics = async (restaurantId: string, tenantId: string): Promise<IInventoryAnalytics> => {
    await assertRestaurantExists(restaurantId, tenantId);

    const inventory = await prisma.restaurantInventory.findMany({
        where: { restaurantId, tenantId, isDeleted: false },
        include: { ingredient: true },
    });

    const totalIngredientCount = inventory.length;

    const lowStockItems = inventory
        .filter(
            (inv) =>
                inv.thresholdQuantity !== null &&
                inv.availableQuantity <= inv.thresholdQuantity!,
        )
        .map((inv) => ({
            id: inv.id,
            ingredientName: inv.ingredient.name,
            unit: inv.ingredient.unit,
            availableQuantity: inv.availableQuantity,
            thresholdQuantity: inv.thresholdQuantity,
        }));

    // Most-used ingredients (by number of menu products they appear in)
    const ingredientUsage = await prisma.menuProductIngredient.groupBy({
        by: ['ingredientId'],
        where: { menuProduct: { restaurantId, tenantId, isDeleted: false }, isDeleted: false },
        _count: { menuProductId: true },
        orderBy: { _count: { menuProductId: 'desc' } },
        take: 10,
    });

    const ingredientIds = ingredientUsage.map((u) => u.ingredientId);
    const ingredients = await prisma.inventoryIngredient.findMany({
        where: { id: { in: ingredientIds } },
        select: { id: true, name: true },
    });
    const ingredientNameMap: Record<string, string> = {};
    ingredients.forEach((ing) => (ingredientNameMap[ing.id] = ing.name));

    const mostUsedIngredients = ingredientUsage.map((u) => ({
        ingredientName: ingredientNameMap[u.ingredientId] || u.ingredientId,
        usedInProducts: u._count.menuProductId,
    }));

    return {
        totalIngredientCount,
        lowStockCount: lowStockItems.length,
        lowStockItems,
        mostUsedIngredients,
    };
};

// ── Restaurants (Owner) ───────────────────────────────────────────────────────

const getRestaurantsAnalytics = async (
    userId: string,
    tenantId: string,
    dateRange: IDateRange,
): Promise<IRestaurantsAnalytics> => {
    const dateFilter = buildDateFilter(dateRange);

    // Get all restaurants owned by this user
    const owner = await prisma.owner.findUnique({
        where: { userId },
        include: { restaurants: true },
    });

    if (!owner || owner.restaurants.length === 0) {
        return { restaurants: [], bestPerforming: null, worstPerforming: null };
    }

    const restaurantList = await Promise.all(
        owner.restaurants.map(async (restaurant) => {
            const restaurantId = restaurant.id;

            // Revenue + orders
            const orders = await db.order.findMany({
                where: {
                    items: { some: { menuItem: { restaurantId } } },
                    status: 'DELIVERED',
                    ...(dateFilter && { createdAt: dateFilter }),
                },
                select: { totalPrice: true },
            });
            const totalRevenue: number = orders.reduce(
                (sum: number, o: any) => sum + o.totalPrice,
                0,
            );
            const totalOrders = orders.length;

            // Menu product count
            const menuProductCount = await prisma.menuProduct.count({
                where: { restaurantId, isDeleted: false },
            });

            // Staff count
            const [chefCount, waiterCount, managerCount] = await Promise.all([
                prisma.chef.count({ where: { restaurantId, isDeleted: false } }),
                prisma.waiter.count({ where: { restaurantId, isDeleted: false } }),
                prisma.manager.count({ where: { restaurantId, isDeleted: false } }),
            ]);
            const staffCount = chefCount + waiterCount + managerCount;

            // Low stock count
            const inventory = await prisma.restaurantInventory.findMany({
                where: { restaurantId, isDeleted: false, thresholdQuantity: { gt: 0 } },
                select: { availableQuantity: true, thresholdQuantity: true },
            });
            const lowStockCount = inventory.filter(
                (inv) => inv.availableQuantity <= inv.thresholdQuantity,
            ).length;

            return {
                restaurantId,
                restaurantName: restaurant.name,
                totalRevenue,
                totalOrders,
                menuProductCount,
                staffCount,
                lowStockCount,
            };
        }),
    );

    const sorted = [...restaurantList].sort((a, b) => b.totalRevenue - a.totalRevenue);
    const bestPerforming = sorted[0] ?? null;
    const worstPerforming = sorted[sorted.length - 1] ?? null;

    return { restaurants: restaurantList, bestPerforming, worstPerforming };
};

// ── Summary (/analytics) ──────────────────────────────────────────────────────

const getSummaryAnalytics = async (
    userId: string,
    tenantId: string,
    restaurantId: string | undefined,
    dateRange: IDateRange,
): Promise<IAnalyticsSummary> => {
    const dateFilter = buildDateFilter(dateRange);

    // Determine which restaurants to aggregate over
    let restaurantIds: string[] = [];
    if (restaurantId) {
        await assertRestaurantExists(restaurantId, tenantId);
        restaurantIds = [restaurantId];
    } else {
        const owner = await prisma.owner.findUnique({
            where: { userId },
            select: { restaurants: { select: { id: true } } },
        });
        restaurantIds = owner?.restaurants.map((r) => r.id) ?? [];
    }

    if (restaurantIds.length === 0) {
        return {
            totalRevenue: 0,
            totalOrders: 0,
            topProduct: null,
            lowStockCount: 0,
            totalRestaurants: 0,
            totalStaff: 0,
        };
    }

    // Revenue + order count
    const allOrders = await db.order.findMany({
        where: {
            items: { some: { menuItem: { restaurantId: { in: restaurantIds } } } },
            status: 'DELIVERED',
            ...(dateFilter && { createdAt: dateFilter }),
        },
        select: { totalPrice: true },
    });
    const totalRevenue: number = allOrders.reduce(
        (sum: number, o: any) => sum + o.totalPrice,
        0,
    );
    const totalOrders = allOrders.length;

    // Top selling product across these restaurants
    const orderItems = await db.orderItem.findMany({
        where: {
            menuItem: { restaurantId: { in: restaurantIds } },
            order: {
                status: 'DELIVERED',
                ...(dateFilter && { createdAt: dateFilter }),
            },
        },
        select: { name: true, quantity: true },
    });
    const productQtyMap: Record<string, number> = {};
    orderItems.forEach((item: any) => {
        productQtyMap[item.name] = (productQtyMap[item.name] || 0) + item.quantity;
    });
    const topProduct =
        Object.entries(productQtyMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    // Low stock count
    const allInventory = await prisma.restaurantInventory.findMany({
        where: {
            restaurantId: { in: restaurantIds },
            tenantId,
            thresholdQuantity: { gt: 0 },
            isDeleted: false,
        },
        select: { availableQuantity: true, thresholdQuantity: true },
    });
    const lowStockCount = allInventory.filter(
        (inv) => inv.availableQuantity <= inv.thresholdQuantity,
    ).length;

    // Total staff
    const [chefCountTotal, waiterCountTotal, managerCountTotal] = await Promise.all([
        prisma.chef.count({ where: { restaurantId: { in: restaurantIds }, tenantId, isDeleted: false } }),
        prisma.waiter.count({ where: { restaurantId: { in: restaurantIds }, tenantId, isDeleted: false } }),
        prisma.manager.count({ where: { restaurantId: { in: restaurantIds }, tenantId, isDeleted: false } }),
    ]);
    const totalStaff = chefCountTotal + waiterCountTotal + managerCountTotal;

    return {
        totalRevenue,
        totalOrders,
        topProduct,
        lowStockCount,
        totalRestaurants: restaurantIds.length,
        totalStaff,
    };
};

// ── Exports ───────────────────────────────────────────────────────────────────

export const analyticsService = {
    getDashboardAnalytics,
    getOrdersAnalytics,
    getMenuAnalytics,
    getInventoryAnalytics,
    getRestaurantsAnalytics,
    getSummaryAnalytics,
};
