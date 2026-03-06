const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

const makeUuid = (prefix, index) => {
    const suffix = index.toString(16).padStart(12, "0");
    return `${prefix}-0000-4000-8000-${suffix}`;
};

const roundMoney = (value) => Number(value.toFixed(2));

async function main() {
    const passwordHash = await bcrypt.hash("Pass@123", 10);

    const ids = {
        users: {
            owner: "11111111-1111-1111-1111-111111111111",
            manager: "11111111-1111-1111-1111-111111111112",
            chef: "11111111-1111-1111-1111-111111111113",
            waiter: "11111111-1111-1111-1111-111111111114",
            customer1: "11111111-1111-1111-1111-111111111115",
            customer2: "11111111-1111-1111-1111-111111111116",
            customer3: "11111111-1111-1111-1111-111111111117",
        },
        ownerProfile: "22222222-2222-2222-2222-222222222221",
        managerProfile: "22222222-2222-2222-2222-222222222222",
        chefProfile: "22222222-2222-2222-2222-222222222223",
        waiterProfile: "22222222-2222-2222-2222-222222222224",
        customerProfiles: {
            customer1: "22222222-2222-2222-2222-222222222225",
            customer2: "22222222-2222-2222-2222-222222222226",
            customer3: "22222222-2222-2222-2222-222222222227",
        },
        tenant: "33333333-3333-3333-3333-333333333331",
        restaurant: "44444444-4444-4444-4444-444444444441",
        ingredients: {
            chicken: "55555555-5555-5555-5555-555555555551",
            rice: "55555555-5555-5555-5555-555555555552",
            lettuce: "55555555-5555-5555-5555-555555555553",
            tomato: "55555555-5555-5555-5555-555555555554",
            cheese: "55555555-5555-5555-5555-555555555555",
            colaSyrup: "55555555-5555-5555-5555-555555555556",
            beef: "55555555-5555-5555-5555-555555555557",
            flour: "55555555-5555-5555-5555-555555555558",
            shrimp: "55555555-5555-5555-5555-555555555559",
            milk: "55555555-5555-5555-5555-55555555555a",
            potato: "55555555-5555-5555-5555-55555555555b",
            coffeeBeans: "55555555-5555-5555-5555-55555555555c",
            mango: "55555555-5555-5555-5555-55555555555d",
        },
        inventory: {
            chicken: "66666666-6666-6666-6666-666666666661",
            rice: "66666666-6666-6666-6666-666666666662",
            lettuce: "66666666-6666-6666-6666-666666666663",
            tomato: "66666666-6666-6666-6666-666666666664",
            cheese: "66666666-6666-6666-6666-666666666665",
            colaSyrup: "66666666-6666-6666-6666-666666666666",
            beef: "66666666-6666-6666-6666-666666666667",
            flour: "66666666-6666-6666-6666-666666666668",
            shrimp: "66666666-6666-6666-6666-666666666669",
            milk: "66666666-6666-6666-6666-66666666666a",
            potato: "66666666-6666-6666-6666-66666666666b",
            coffeeBeans: "66666666-6666-6666-6666-66666666666c",
            mango: "66666666-6666-6666-6666-66666666666d",
        },
        menuProducts: {
            grilledChicken: "77777777-7777-7777-7777-777777777771",
            vegSalad: "77777777-7777-7777-7777-777777777772",
            chocoCake: "77777777-7777-7777-7777-777777777773",
            cola: "77777777-7777-7777-7777-777777777774",
            beefBurger: "77777777-7777-7777-7777-777777777775",
            margheritaPizza: "77777777-7777-7777-7777-777777777776",
            shrimpPasta: "77777777-7777-7777-7777-777777777777",
            mangoSmoothie: "77777777-7777-7777-7777-777777777778",
            icedLatte: "77777777-7777-7777-7777-777777777779",
            garlicFries: "77777777-7777-7777-7777-77777777777a",
        },
        menuIngredients: {
            grilledChickenChicken: "88888888-8888-8888-8888-888888888881",
            grilledChickenRice: "88888888-8888-8888-8888-888888888882",
            saladLettuce: "88888888-8888-8888-8888-888888888883",
            saladTomato: "88888888-8888-8888-8888-888888888884",
            cakeCheese: "88888888-8888-8888-8888-888888888885",
            colaSyrup: "88888888-8888-8888-8888-888888888886",
            burgerBeef: "88888888-8888-8888-8888-888888888887",
            burgerCheese: "88888888-8888-8888-8888-888888888888",
            pizzaFlour: "88888888-8888-8888-8888-888888888889",
            pizzaCheese: "88888888-8888-8888-8888-88888888888a",
            pastaShrimp: "88888888-8888-8888-8888-88888888888b",
            pastaTomato: "88888888-8888-8888-8888-88888888888c",
            smoothieMango: "88888888-8888-8888-8888-88888888888d",
            smoothieMilk: "88888888-8888-8888-8888-88888888888e",
            latteCoffee: "88888888-8888-8888-8888-88888888888f",
            latteMilk: "88888888-8888-8888-8888-888888888890",
            friesPotato: "88888888-8888-8888-8888-888888888891",
            friesCheese: "88888888-8888-8888-8888-888888888892",
        },
        variants: {
            chickenSmall: "99999999-9999-9999-9999-999999999991",
            chickenLarge: "99999999-9999-9999-9999-999999999992",
            colaMedium: "99999999-9999-9999-9999-999999999993",
            colaLarge: "99999999-9999-9999-9999-999999999994",
            burgerSmall: "99999999-9999-9999-9999-999999999995",
            burgerLarge: "99999999-9999-9999-9999-999999999996",
            pizzaMedium: "99999999-9999-9999-9999-999999999997",
            pizzaFamily: "99999999-9999-9999-9999-999999999998",
            pastaSmall: "99999999-9999-9999-9999-999999999999",
            pastaLarge: "99999999-9999-9999-9999-99999999999a",
            smoothieMedium: "99999999-9999-9999-9999-99999999999b",
            smoothieLarge: "99999999-9999-9999-9999-99999999999c",
            latteSmall: "99999999-9999-9999-9999-99999999999d",
            latteLarge: "99999999-9999-9999-9999-99999999999e",
            friesSmall: "99999999-9999-9999-9999-99999999999f",
            friesLarge: "99999999-9999-9999-9999-9999999999a0",
        },
        addons: {
            extraCheese: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
            extraSauce: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2",
            lemonSlice: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3",
            burgerPatty: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4",
            pizzaOlives: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5",
            pastaCheese: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6",
            smoothieProtein: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa7",
            latteExtraShot: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa8",
            friesDip: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9",
        },
        tables: {
            t1: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1",
            t2: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2",
            t3: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3",
            t4: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4",
        },
        coupons: {
            welcome10: "cccccccc-cccc-cccc-cccc-ccccccccccc1",
            flat5: "cccccccc-cccc-cccc-cccc-ccccccccccc2",
        },
        orders: {
            order1: "dddddddd-dddd-dddd-dddd-ddddddddddd1",
            order2: "dddddddd-dddd-dddd-dddd-ddddddddddd2",
            order3: "dddddddd-dddd-dddd-dddd-ddddddddddd3",
            order4: "dddddddd-dddd-dddd-dddd-ddddddddddd4",
        },
        orderItems: {
            o1Item1: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1",
            o1Item2: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2",
            o2Item1: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3",
            o2Item2: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee4",
            o3Item1: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5",
            o4Item1: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee6",
        },
        orderItemAddons: {
            o1Addon1: "ffffffff-ffff-ffff-ffff-fffffffffff1",
            o2Addon1: "ffffffff-ffff-ffff-ffff-fffffffffff2",
            o4Addon1: "ffffffff-ffff-ffff-ffff-fffffffffff3",
        },
        couponUsages: {
            usage1: "12121212-1212-1212-1212-121212121211",
            usage2: "12121212-1212-1212-1212-121212121212",
        },
        payments: {
            p1: "13131313-1313-1313-1313-131313131311",
            p2: "13131313-1313-1313-1313-131313131312",
            p3: "13131313-1313-1313-1313-131313131313",
            p4: "13131313-1313-1313-1313-131313131314",
        },
        reservations: {
            r1: "14141414-1414-1414-1414-141414141411",
            r2: "14141414-1414-1414-1414-141414141412",
            r3: "14141414-1414-1414-1414-141414141413",
        },
        reviews: {
            rev1: "15151515-1515-1515-1515-151515151511",
            rev2: "15151515-1515-1515-1515-151515151512",
            rev3: "15151515-1515-1515-1515-151515151513",
        },
    };

    await prisma.$transaction(async (tx) => {
        await tx.review.deleteMany();
        await tx.payment.deleteMany();
        await tx.couponUsage.deleteMany();
        await tx.orderItemAddon.deleteMany();
        await tx.orderItem.deleteMany();
        await tx.order.deleteMany();
        await tx.reservation.deleteMany();
        await tx.table.deleteMany();
        await tx.coupon.deleteMany();
        await tx.addon.deleteMany();
        await tx.variant.deleteMany();
        await tx.menuProductIngredient.deleteMany();
        await tx.restaurantInventory.deleteMany();
        await tx.menuProduct.deleteMany();
        await tx.inventoryIngredient.deleteMany();
        await tx.manager.deleteMany();
        await tx.waiter.deleteMany();
        await tx.chef.deleteMany();
        await tx.restaurant.deleteMany();
        await tx.tenant.deleteMany();
        await tx.customer.deleteMany();
        await tx.owner.deleteMany();
        await tx.user.deleteMany();

        await tx.user.createMany({
            data: [
                {
                    id: ids.users.owner,
                    email: "owner@neorms.dev",
                    fullName: "Ezio Owner",
                    role: "OWNER",
                    password: passwordHash,
                    authProvider: "local",
                    isVerified: true,
                    avatar: "https://i.pravatar.cc/300?u=owner",
                },
                {
                    id: ids.users.manager,
                    email: "manager@neorms.dev",
                    fullName: "Maya Manager",
                    role: "MANAGER",
                    password: passwordHash,
                    authProvider: "local",
                    isVerified: true,
                    avatar: "https://i.pravatar.cc/300?u=manager",
                },
                {
                    id: ids.users.chef,
                    email: "chef@neorms.dev",
                    fullName: "Chad Chef",
                    role: "CHEF",
                    password: passwordHash,
                    authProvider: "local",
                    isVerified: true,
                    avatar: "https://i.pravatar.cc/300?u=chef",
                },
                {
                    id: ids.users.waiter,
                    email: "waiter@neorms.dev",
                    fullName: "Walt Waiter",
                    role: "WAITER",
                    password: passwordHash,
                    authProvider: "local",
                    isVerified: true,
                    avatar: "https://i.pravatar.cc/300?u=waiter",
                },
                {
                    id: ids.users.customer1,
                    email: "customer1@neorms.dev",
                    fullName: "Cathy Customer",
                    role: "CUSTOMER",
                    password: passwordHash,
                    authProvider: "local",
                    isVerified: true,
                    avatar: "https://i.pravatar.cc/300?u=customer1",
                },
                {
                    id: ids.users.customer2,
                    email: "customer2@neorms.dev",
                    fullName: "Carlos Customer",
                    role: "CUSTOMER",
                    password: passwordHash,
                    authProvider: "google",
                    isVerified: true,
                    avatar: "https://i.pravatar.cc/300?u=customer2",
                },
                {
                    id: ids.users.customer3,
                    email: "customer3@neorms.dev",
                    fullName: "Chloe Customer",
                    role: "CUSTOMER",
                    password: passwordHash,
                    authProvider: "local",
                    isVerified: false,
                    verificationOTP: 834201,
                    avatar: "https://i.pravatar.cc/300?u=customer3",
                },
            ],
        });

        await tx.owner.create({
            data: {
                id: ids.ownerProfile,
                userId: ids.users.owner,
                lastUpdatedBy: ids.users.owner,
            },
        });

        await tx.customer.createMany({
            data: [
                {
                    id: ids.customerProfiles.customer1,
                    userId: ids.users.customer1,
                    restaurants: [ids.restaurant],
                    lastUpdatedBy: ids.users.owner,
                },
                {
                    id: ids.customerProfiles.customer2,
                    userId: ids.users.customer2,
                    restaurants: [ids.restaurant],
                    lastUpdatedBy: ids.users.owner,
                },
                {
                    id: ids.customerProfiles.customer3,
                    userId: ids.users.customer3,
                    restaurants: [ids.restaurant],
                    lastUpdatedBy: ids.users.owner,
                },
            ],
        });

        await tx.tenant.create({
            data: {
                id: ids.tenant,
                name: "Neo RMS Demo Tenant",
                slug: "neo-rms-demo",
                plan: "pro",
                subscriptionStatus: "active",
                isActive: true,
                ownerId: ids.users.owner,
                lastUpdatedBy: ids.users.owner,
            },
        });

        await tx.restaurant.create({
            data: {
                id: ids.restaurant,
                name: "Neo Bites",
                tagline: "Fast. Fresh. Flavorful.",
                description: "Demo restaurant for end-to-end testing.",
                location: "Dhaka, Bangladesh",
                contactInfo: "+8801700000000",
                bannerImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
                tenantId: ids.tenant,
                ownerId: ids.users.owner,
                lastUpdatedBy: ids.users.owner,
            },
        });

        await tx.manager.create({
            data: {
                id: ids.managerProfile,
                userId: ids.users.manager,
                tenantId: ids.tenant,
                restaurantId: ids.restaurant,
                lastUpdatedBy: ids.users.owner,
            },
        });

        await tx.chef.create({
            data: {
                id: ids.chefProfile,
                userId: ids.users.chef,
                tenantId: ids.tenant,
                restaurantId: ids.restaurant,
                lastUpdatedBy: ids.users.manager,
            },
        });

        await tx.waiter.create({
            data: {
                id: ids.waiterProfile,
                userId: ids.users.waiter,
                tenantId: ids.tenant,
                restaurantId: ids.restaurant,
                lastUpdatedBy: ids.users.manager,
            },
        });

        await tx.inventoryIngredient.createMany({
            data: [
                { id: ids.ingredients.chicken, name: "Chicken Breast", unit: "KILOGRAM", lastUpdatedBy: ids.users.chef },
                { id: ids.ingredients.rice, name: "Basmati Rice", unit: "KILOGRAM", lastUpdatedBy: ids.users.chef },
                { id: ids.ingredients.lettuce, name: "Lettuce", unit: "GRAM", lastUpdatedBy: ids.users.chef },
                { id: ids.ingredients.tomato, name: "Tomato", unit: "KILOGRAM", lastUpdatedBy: ids.users.chef },
                { id: ids.ingredients.cheese, name: "Cheddar Cheese", unit: "GRAM", lastUpdatedBy: ids.users.chef },
                { id: ids.ingredients.colaSyrup, name: "Cola Syrup", unit: "LITER", lastUpdatedBy: ids.users.chef },
                { id: ids.ingredients.beef, name: "Minced Beef", unit: "KILOGRAM", lastUpdatedBy: ids.users.chef },
                { id: ids.ingredients.flour, name: "Pizza Flour", unit: "KILOGRAM", lastUpdatedBy: ids.users.chef },
                { id: ids.ingredients.shrimp, name: "Shrimp", unit: "KILOGRAM", lastUpdatedBy: ids.users.chef },
                { id: ids.ingredients.milk, name: "Fresh Milk", unit: "LITER", lastUpdatedBy: ids.users.chef },
                { id: ids.ingredients.potato, name: "Potato", unit: "KILOGRAM", lastUpdatedBy: ids.users.chef },
                { id: ids.ingredients.coffeeBeans, name: "Coffee Beans", unit: "GRAM", lastUpdatedBy: ids.users.chef },
                { id: ids.ingredients.mango, name: "Mango Pulp", unit: "LITER", lastUpdatedBy: ids.users.chef },
            ],
        });

        await tx.restaurantInventory.createMany({
            data: [
                {
                    id: ids.inventory.chicken,
                    availableQuantity: 30,
                    thresholdQuantity: 10,
                    restaurantId: ids.restaurant,
                    ingredientId: ids.ingredients.chicken,
                    tenantId: ids.tenant,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.inventory.rice,
                    availableQuantity: 45,
                    thresholdQuantity: 12,
                    restaurantId: ids.restaurant,
                    ingredientId: ids.ingredients.rice,
                    tenantId: ids.tenant,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.inventory.lettuce,
                    availableQuantity: 7500,
                    thresholdQuantity: 1500,
                    restaurantId: ids.restaurant,
                    ingredientId: ids.ingredients.lettuce,
                    tenantId: ids.tenant,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.inventory.tomato,
                    availableQuantity: 25,
                    thresholdQuantity: 8,
                    restaurantId: ids.restaurant,
                    ingredientId: ids.ingredients.tomato,
                    tenantId: ids.tenant,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.inventory.cheese,
                    availableQuantity: 6000,
                    thresholdQuantity: 2000,
                    restaurantId: ids.restaurant,
                    ingredientId: ids.ingredients.cheese,
                    tenantId: ids.tenant,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.inventory.colaSyrup,
                    availableQuantity: 20,
                    thresholdQuantity: 5,
                    restaurantId: ids.restaurant,
                    ingredientId: ids.ingredients.colaSyrup,
                    tenantId: ids.tenant,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.inventory.beef,
                    availableQuantity: 26,
                    thresholdQuantity: 8,
                    restaurantId: ids.restaurant,
                    ingredientId: ids.ingredients.beef,
                    tenantId: ids.tenant,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.inventory.flour,
                    availableQuantity: 40,
                    thresholdQuantity: 10,
                    restaurantId: ids.restaurant,
                    ingredientId: ids.ingredients.flour,
                    tenantId: ids.tenant,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.inventory.shrimp,
                    availableQuantity: 18,
                    thresholdQuantity: 6,
                    restaurantId: ids.restaurant,
                    ingredientId: ids.ingredients.shrimp,
                    tenantId: ids.tenant,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.inventory.milk,
                    availableQuantity: 35,
                    thresholdQuantity: 8,
                    restaurantId: ids.restaurant,
                    ingredientId: ids.ingredients.milk,
                    tenantId: ids.tenant,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.inventory.potato,
                    availableQuantity: 55,
                    thresholdQuantity: 15,
                    restaurantId: ids.restaurant,
                    ingredientId: ids.ingredients.potato,
                    tenantId: ids.tenant,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.inventory.coffeeBeans,
                    availableQuantity: 9500,
                    thresholdQuantity: 2200,
                    restaurantId: ids.restaurant,
                    ingredientId: ids.ingredients.coffeeBeans,
                    tenantId: ids.tenant,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.inventory.mango,
                    availableQuantity: 14,
                    thresholdQuantity: 4,
                    restaurantId: ids.restaurant,
                    ingredientId: ids.ingredients.mango,
                    tenantId: ids.tenant,
                    lastUpdatedBy: ids.users.chef,
                },
            ],
        });

        await tx.menuProduct.createMany({
            data: [
                {
                    id: ids.menuProducts.grilledChicken,
                    restaurantId: ids.restaurant,
                    tenantId: ids.tenant,
                    productTitle: "Grilled Chicken Bowl",
                    productDescription: "Flame grilled chicken with fragrant rice.",
                    estimatedCookingTime: 18,
                    userRating: 4.6,
                    aiRating: 4.5,
                    status: "AVAILABLE",
                    priceCurrency: "BDT",
                    basePrice: null,
                    category: "MAIN_COURSE",
                    dietaryTags: ["HALAL", "DAIRY_FREE", "NUT_FREE"],
                    images: [
                        "https://images.unsplash.com/photo-1512058564366-18510be2db19",
                        "https://images.unsplash.com/photo-1603133872878-684f208fb84b",
                    ],
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.menuProducts.vegSalad,
                    restaurantId: ids.restaurant,
                    tenantId: ids.tenant,
                    productTitle: "Garden Veggie Salad",
                    productDescription: "Fresh greens, tomatoes and citrus dressing.",
                    estimatedCookingTime: 8,
                    userRating: 4.3,
                    aiRating: 4.2,
                    status: "AVAILABLE",
                    priceCurrency: "BDT",
                    basePrice: 220,
                    category: "STARTER",
                    dietaryTags: ["VEGETARIAN", "GLUTEN_FREE", "DAIRY_FREE"],
                    images: ["https://images.unsplash.com/photo-1546793665-c74683f339c1"],
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.menuProducts.chocoCake,
                    restaurantId: ids.restaurant,
                    tenantId: ids.tenant,
                    productTitle: "Chocolate Cheese Cake",
                    productDescription: "Rich baked cheesecake with chocolate ganache.",
                    estimatedCookingTime: 0,
                    userRating: 4.8,
                    aiRating: 4.7,
                    status: "AVAILABLE",
                    priceCurrency: "BDT",
                    basePrice: 280,
                    category: "DESSERT",
                    dietaryTags: ["VEGETARIAN"],
                    images: ["https://images.unsplash.com/photo-1627308595229-7830a5c91f9f"],
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.menuProducts.cola,
                    restaurantId: ids.restaurant,
                    tenantId: ids.tenant,
                    productTitle: "House Cola",
                    productDescription: "Signature fizzy cola.",
                    estimatedCookingTime: 1,
                    userRating: 4.1,
                    aiRating: 4.0,
                    status: "AVAILABLE",
                    priceCurrency: "BDT",
                    basePrice: null,
                    category: "BEVERAGE",
                    dietaryTags: ["VEGAN", "DAIRY_FREE", "NUT_FREE"],
                    images: ["https://images.unsplash.com/photo-1622483767028-3f66f32aef97"],
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.menuProducts.beefBurger,
                    restaurantId: ids.restaurant,
                    tenantId: ids.tenant,
                    productTitle: "Smoky Beef Burger",
                    productDescription: "Juicy beef patty burger with house sauce.",
                    estimatedCookingTime: 15,
                    userRating: 4.5,
                    aiRating: 4.4,
                    status: "AVAILABLE",
                    priceCurrency: "BDT",
                    basePrice: null,
                    category: "MAIN_COURSE",
                    dietaryTags: ["HALAL"],
                    images: ["https://images.unsplash.com/photo-1568901346375-23c9450c58cd"],
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.menuProducts.margheritaPizza,
                    restaurantId: ids.restaurant,
                    tenantId: ids.tenant,
                    productTitle: "Margherita Pizza",
                    productDescription: "Stone baked pizza with tomato and cheese.",
                    estimatedCookingTime: 20,
                    userRating: 4.6,
                    aiRating: 4.5,
                    status: "AVAILABLE",
                    priceCurrency: "BDT",
                    basePrice: null,
                    category: "MAIN_COURSE",
                    dietaryTags: ["VEGETARIAN"],
                    images: ["https://images.unsplash.com/photo-1574071318508-1cdbab80d002"],
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.menuProducts.shrimpPasta,
                    restaurantId: ids.restaurant,
                    tenantId: ids.tenant,
                    productTitle: "Creamy Shrimp Pasta",
                    productDescription: "Penne pasta with shrimp in creamy tomato sauce.",
                    estimatedCookingTime: 17,
                    userRating: 4.4,
                    aiRating: 4.3,
                    status: "AVAILABLE",
                    priceCurrency: "BDT",
                    basePrice: null,
                    category: "MAIN_COURSE",
                    dietaryTags: ["NUT_FREE"],
                    images: ["https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9"],
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.menuProducts.mangoSmoothie,
                    restaurantId: ids.restaurant,
                    tenantId: ids.tenant,
                    productTitle: "Mango Smoothie",
                    productDescription: "Fresh mango blend with chilled milk.",
                    estimatedCookingTime: 3,
                    userRating: 4.2,
                    aiRating: 4.1,
                    status: "AVAILABLE",
                    priceCurrency: "BDT",
                    basePrice: null,
                    category: "BEVERAGE",
                    dietaryTags: ["GLUTEN_FREE", "NUT_FREE"],
                    images: ["https://images.unsplash.com/photo-1623065422902-30a2d299bbe4"],
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.menuProducts.icedLatte,
                    restaurantId: ids.restaurant,
                    tenantId: ids.tenant,
                    productTitle: "Iced Caffe Latte",
                    productDescription: "Cold brew coffee with fresh milk and ice.",
                    estimatedCookingTime: 2,
                    userRating: 4.1,
                    aiRating: 4.0,
                    status: "AVAILABLE",
                    priceCurrency: "BDT",
                    basePrice: null,
                    category: "BEVERAGE",
                    dietaryTags: ["VEGETARIAN", "GLUTEN_FREE"],
                    images: ["https://images.unsplash.com/photo-1461023058943-07fcbe16d735"],
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.menuProducts.garlicFries,
                    restaurantId: ids.restaurant,
                    tenantId: ids.tenant,
                    productTitle: "Garlic Parmesan Fries",
                    productDescription: "Crispy fries tossed in garlic parmesan seasoning.",
                    estimatedCookingTime: 9,
                    userRating: 4.3,
                    aiRating: 4.2,
                    status: "AVAILABLE",
                    priceCurrency: "BDT",
                    basePrice: null,
                    category: "SIDE",
                    dietaryTags: ["VEGETARIAN"],
                    images: ["https://images.unsplash.com/photo-1630384060421-cb20d0e0649d"],
                    lastUpdatedBy: ids.users.chef,
                },
            ],
        });

        await tx.menuProductIngredient.createMany({
            data: [
                {
                    id: ids.menuIngredients.grilledChickenChicken,
                    requiredQuantity: 0.25,
                    menuProductId: ids.menuProducts.grilledChicken,
                    ingredientId: ids.ingredients.chicken,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.menuIngredients.grilledChickenRice,
                    requiredQuantity: 0.18,
                    menuProductId: ids.menuProducts.grilledChicken,
                    ingredientId: ids.ingredients.rice,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.menuIngredients.saladLettuce,
                    requiredQuantity: 120,
                    menuProductId: ids.menuProducts.vegSalad,
                    ingredientId: ids.ingredients.lettuce,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.menuIngredients.saladTomato,
                    requiredQuantity: 0.12,
                    menuProductId: ids.menuProducts.vegSalad,
                    ingredientId: ids.ingredients.tomato,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.menuIngredients.cakeCheese,
                    requiredQuantity: 80,
                    menuProductId: ids.menuProducts.chocoCake,
                    ingredientId: ids.ingredients.cheese,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.menuIngredients.colaSyrup,
                    requiredQuantity: 0.22,
                    menuProductId: ids.menuProducts.cola,
                    ingredientId: ids.ingredients.colaSyrup,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.menuIngredients.burgerBeef,
                    requiredQuantity: 0.2,
                    menuProductId: ids.menuProducts.beefBurger,
                    ingredientId: ids.ingredients.beef,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.menuIngredients.burgerCheese,
                    requiredQuantity: 35,
                    menuProductId: ids.menuProducts.beefBurger,
                    ingredientId: ids.ingredients.cheese,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.menuIngredients.pizzaFlour,
                    requiredQuantity: 0.18,
                    menuProductId: ids.menuProducts.margheritaPizza,
                    ingredientId: ids.ingredients.flour,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.menuIngredients.pizzaCheese,
                    requiredQuantity: 120,
                    menuProductId: ids.menuProducts.margheritaPizza,
                    ingredientId: ids.ingredients.cheese,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.menuIngredients.pastaShrimp,
                    requiredQuantity: 0.15,
                    menuProductId: ids.menuProducts.shrimpPasta,
                    ingredientId: ids.ingredients.shrimp,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.menuIngredients.pastaTomato,
                    requiredQuantity: 0.08,
                    menuProductId: ids.menuProducts.shrimpPasta,
                    ingredientId: ids.ingredients.tomato,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.menuIngredients.smoothieMango,
                    requiredQuantity: 0.22,
                    menuProductId: ids.menuProducts.mangoSmoothie,
                    ingredientId: ids.ingredients.mango,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.menuIngredients.smoothieMilk,
                    requiredQuantity: 0.16,
                    menuProductId: ids.menuProducts.mangoSmoothie,
                    ingredientId: ids.ingredients.milk,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.menuIngredients.latteCoffee,
                    requiredQuantity: 20,
                    menuProductId: ids.menuProducts.icedLatte,
                    ingredientId: ids.ingredients.coffeeBeans,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.menuIngredients.latteMilk,
                    requiredQuantity: 0.2,
                    menuProductId: ids.menuProducts.icedLatte,
                    ingredientId: ids.ingredients.milk,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.menuIngredients.friesPotato,
                    requiredQuantity: 0.22,
                    menuProductId: ids.menuProducts.garlicFries,
                    ingredientId: ids.ingredients.potato,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.menuIngredients.friesCheese,
                    requiredQuantity: 30,
                    menuProductId: ids.menuProducts.garlicFries,
                    ingredientId: ids.ingredients.cheese,
                    lastUpdatedBy: ids.users.chef,
                },
            ],
        });

        await tx.variant.createMany({
            data: [
                {
                    id: ids.variants.chickenSmall,
                    type: "SMALL",
                    price: 340,
                    discount: 0,
                    menuProductId: ids.menuProducts.grilledChicken,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.variants.chickenLarge,
                    type: "LARGE",
                    price: 480,
                    discount: 30,
                    menuProductId: ids.menuProducts.grilledChicken,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.variants.colaMedium,
                    type: "MEDIUM",
                    price: 110,
                    discount: 0,
                    menuProductId: ids.menuProducts.cola,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.variants.colaLarge,
                    type: "LARGE",
                    price: 160,
                    discount: 10,
                    menuProductId: ids.menuProducts.cola,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.variants.burgerSmall,
                    type: "SMALL",
                    price: 320,
                    discount: 0,
                    menuProductId: ids.menuProducts.beefBurger,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.variants.burgerLarge,
                    type: "LARGE",
                    price: 460,
                    discount: 25,
                    menuProductId: ids.menuProducts.beefBurger,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.variants.pizzaMedium,
                    type: "MEDIUM",
                    price: 520,
                    discount: 0,
                    menuProductId: ids.menuProducts.margheritaPizza,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.variants.pizzaFamily,
                    type: "FAMILY",
                    price: 790,
                    discount: 40,
                    menuProductId: ids.menuProducts.margheritaPizza,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.variants.pastaSmall,
                    type: "SMALL",
                    price: 360,
                    discount: 0,
                    menuProductId: ids.menuProducts.shrimpPasta,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.variants.pastaLarge,
                    type: "LARGE",
                    price: 520,
                    discount: 30,
                    menuProductId: ids.menuProducts.shrimpPasta,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.variants.smoothieMedium,
                    type: "MEDIUM",
                    price: 180,
                    discount: 0,
                    menuProductId: ids.menuProducts.mangoSmoothie,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.variants.smoothieLarge,
                    type: "LARGE",
                    price: 240,
                    discount: 20,
                    menuProductId: ids.menuProducts.mangoSmoothie,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.variants.latteSmall,
                    type: "SMALL",
                    price: 170,
                    discount: 0,
                    menuProductId: ids.menuProducts.icedLatte,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.variants.latteLarge,
                    type: "LARGE",
                    price: 240,
                    discount: 15,
                    menuProductId: ids.menuProducts.icedLatte,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.variants.friesSmall,
                    type: "SMALL",
                    price: 160,
                    discount: 0,
                    menuProductId: ids.menuProducts.garlicFries,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.variants.friesLarge,
                    type: "LARGE",
                    price: 230,
                    discount: 15,
                    menuProductId: ids.menuProducts.garlicFries,
                    lastUpdatedBy: ids.users.chef,
                },
            ],
        });

        await tx.addon.createMany({
            data: [
                {
                    id: ids.addons.extraCheese,
                    name: "Extra Cheese",
                    price: 40,
                    menuProductId: ids.menuProducts.grilledChicken,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.addons.extraSauce,
                    name: "Spicy Sauce",
                    price: 20,
                    menuProductId: ids.menuProducts.grilledChicken,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.addons.lemonSlice,
                    name: "Lemon Slice",
                    price: 10,
                    menuProductId: ids.menuProducts.cola,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.addons.burgerPatty,
                    name: "Extra Patty",
                    price: 120,
                    menuProductId: ids.menuProducts.beefBurger,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.addons.pizzaOlives,
                    name: "Black Olives",
                    price: 60,
                    menuProductId: ids.menuProducts.margheritaPizza,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.addons.pastaCheese,
                    name: "Parmesan Topping",
                    price: 50,
                    menuProductId: ids.menuProducts.shrimpPasta,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.addons.smoothieProtein,
                    name: "Protein Scoop",
                    price: 70,
                    menuProductId: ids.menuProducts.mangoSmoothie,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.addons.latteExtraShot,
                    name: "Extra Espresso Shot",
                    price: 45,
                    menuProductId: ids.menuProducts.icedLatte,
                    lastUpdatedBy: ids.users.chef,
                },
                {
                    id: ids.addons.friesDip,
                    name: "Cheese Dip",
                    price: 35,
                    menuProductId: ids.menuProducts.garlicFries,
                    lastUpdatedBy: ids.users.chef,
                },
            ],
        });

        await tx.table.createMany({
            data: [
                {
                    id: ids.tables.t1,
                    tableNumber: 1,
                    capacity: 2,
                    restaurantId: ids.restaurant,
                    tenantId: ids.tenant,
                    lastUpdatedBy: ids.users.manager,
                },
                {
                    id: ids.tables.t2,
                    tableNumber: 2,
                    capacity: 4,
                    restaurantId: ids.restaurant,
                    tenantId: ids.tenant,
                    lastUpdatedBy: ids.users.manager,
                },
                {
                    id: ids.tables.t3,
                    tableNumber: 3,
                    capacity: 6,
                    restaurantId: ids.restaurant,
                    tenantId: ids.tenant,
                    lastUpdatedBy: ids.users.manager,
                },
                {
                    id: ids.tables.t4,
                    tableNumber: 4,
                    capacity: 8,
                    restaurantId: ids.restaurant,
                    tenantId: ids.tenant,
                    lastUpdatedBy: ids.users.manager,
                },
            ],
        });

        await tx.coupon.createMany({
            data: [
                {
                    id: ids.coupons.welcome10,
                    code: "WELCOME10",
                    description: "10% off for first orders",
                    discount: 10,
                    discountType: "PERCENTAGE",
                    validFrom: new Date("2026-01-01T00:00:00.000Z"),
                    validUntil: new Date("2027-01-01T00:00:00.000Z"),
                    usageLimit: 1000,
                    usedCount: 1,
                    minOrderAmount: 300,
                    maxDiscount: 200,
                    perUserLimit: 1,
                    status: "ACTIVE",
                    tenantId: ids.tenant,
                    restaurantId: ids.restaurant,
                    lastUpdatedBy: ids.users.manager,
                },
                {
                    id: ids.coupons.flat5,
                    code: "FLAT50",
                    description: "Flat 50 BDT off",
                    discount: 50,
                    discountType: "AMOUNT",
                    validFrom: new Date("2025-01-01T00:00:00.000Z"),
                    validUntil: new Date("2026-12-31T23:59:59.000Z"),
                    usageLimit: 200,
                    usedCount: 1,
                    minOrderAmount: 250,
                    maxDiscount: null,
                    perUserLimit: 2,
                    status: "ACTIVE",
                    tenantId: ids.tenant,
                    restaurantId: ids.restaurant,
                    lastUpdatedBy: ids.users.manager,
                },
            ],
        });

        const customerCycle = [ids.users.customer1, ids.users.customer2, ids.users.customer3];
        const orderTypeCycle = ["DINE_IN", "DELIVERY", "TAKEAWAY"];
        const paymentMethodCycle = ["CARD", "MOBILE_PAYMENT", "CASH", "ONLINE_PAYMENT"];
        const orderStatusCycle = ["COMPLETED", "DELIVERED", "READY", "CONFIRMED", "PREPARING", "PENDING", "CANCELLED"];

        const menuCatalogForOrders = [
            {
                id: ids.menuProducts.grilledChicken,
                title: "Grilled Chicken Bowl",
                basePrice: 380,
                variants: [
                    { id: ids.variants.chickenSmall, type: "SMALL", price: 340, discount: 0 },
                    { id: ids.variants.chickenLarge, type: "LARGE", price: 480, discount: 30 },
                ],
                addons: [
                    { id: ids.addons.extraCheese, name: "Extra Cheese", price: 40 },
                    { id: ids.addons.extraSauce, name: "Spicy Sauce", price: 20 },
                ],
            },
            {
                id: ids.menuProducts.vegSalad,
                title: "Garden Veggie Salad",
                basePrice: 220,
                variants: [],
                addons: [],
            },
            {
                id: ids.menuProducts.chocoCake,
                title: "Chocolate Cheese Cake",
                basePrice: 280,
                variants: [],
                addons: [],
            },
            {
                id: ids.menuProducts.cola,
                title: "House Cola",
                basePrice: 120,
                variants: [
                    { id: ids.variants.colaMedium, type: "MEDIUM", price: 110, discount: 0 },
                    { id: ids.variants.colaLarge, type: "LARGE", price: 160, discount: 10 },
                ],
                addons: [{ id: ids.addons.lemonSlice, name: "Lemon Slice", price: 10 }],
            },
            {
                id: ids.menuProducts.beefBurger,
                title: "Smoky Beef Burger",
                basePrice: 350,
                variants: [
                    { id: ids.variants.burgerSmall, type: "SMALL", price: 320, discount: 0 },
                    { id: ids.variants.burgerLarge, type: "LARGE", price: 460, discount: 25 },
                ],
                addons: [{ id: ids.addons.burgerPatty, name: "Extra Patty", price: 120 }],
            },
            {
                id: ids.menuProducts.margheritaPizza,
                title: "Margherita Pizza",
                basePrice: 550,
                variants: [
                    { id: ids.variants.pizzaMedium, type: "MEDIUM", price: 520, discount: 0 },
                    { id: ids.variants.pizzaFamily, type: "FAMILY", price: 790, discount: 40 },
                ],
                addons: [{ id: ids.addons.pizzaOlives, name: "Black Olives", price: 60 }],
            },
            {
                id: ids.menuProducts.shrimpPasta,
                title: "Creamy Shrimp Pasta",
                basePrice: 390,
                variants: [
                    { id: ids.variants.pastaSmall, type: "SMALL", price: 360, discount: 0 },
                    { id: ids.variants.pastaLarge, type: "LARGE", price: 520, discount: 30 },
                ],
                addons: [{ id: ids.addons.pastaCheese, name: "Parmesan Topping", price: 50 }],
            },
            {
                id: ids.menuProducts.mangoSmoothie,
                title: "Mango Smoothie",
                basePrice: 190,
                variants: [
                    { id: ids.variants.smoothieMedium, type: "MEDIUM", price: 180, discount: 0 },
                    { id: ids.variants.smoothieLarge, type: "LARGE", price: 240, discount: 20 },
                ],
                addons: [{ id: ids.addons.smoothieProtein, name: "Protein Scoop", price: 70 }],
            },
            {
                id: ids.menuProducts.icedLatte,
                title: "Iced Caffe Latte",
                basePrice: 180,
                variants: [
                    { id: ids.variants.latteSmall, type: "SMALL", price: 170, discount: 0 },
                    { id: ids.variants.latteLarge, type: "LARGE", price: 240, discount: 15 },
                ],
                addons: [{ id: ids.addons.latteExtraShot, name: "Extra Espresso Shot", price: 45 }],
            },
            {
                id: ids.menuProducts.garlicFries,
                title: "Garlic Parmesan Fries",
                basePrice: 170,
                variants: [
                    { id: ids.variants.friesSmall, type: "SMALL", price: 160, discount: 0 },
                    { id: ids.variants.friesLarge, type: "LARGE", price: 230, discount: 15 },
                ],
                addons: [{ id: ids.addons.friesDip, name: "Cheese Dip", price: 35 }],
            },
        ];

        const additionalOrders = [];
        const additionalOrderItems = [];
        const additionalOrderItemAddons = [];
        const additionalPayments = [];
        let addonSerial = 1;

        for (let index = 1; index <= 96; index += 1) {
            const orderId = makeUuid("d0d0d0d0", index);
            const customerId = customerCycle[index % customerCycle.length];
            const orderType = orderTypeCycle[index % orderTypeCycle.length];
            const orderStatus = orderStatusCycle[index % orderStatusCycle.length];
            const paymentMethod = paymentMethodCycle[index % paymentMethodCycle.length];

            const tableId = orderType === "DINE_IN" ? [ids.tables.t1, ids.tables.t2, ids.tables.t3, ids.tables.t4][index % 4] : null;
            const itemCount = 2 + (index % 3);

            let orderTotal = 0;
            for (let offset = 0; offset < itemCount; offset += 1) {
                const menu = menuCatalogForOrders[(index + offset) % menuCatalogForOrders.length];
                const quantity = 1 + ((index + offset) % 2);

                let unitPrice = menu.basePrice;
                let variantId = null;
                let variantType = null;

                if (menu.variants.length > 0) {
                    const selectedVariant = menu.variants[(index + offset) % menu.variants.length];
                    unitPrice = selectedVariant.price - (selectedVariant.discount || 0);
                    variantId = selectedVariant.id;
                    variantType = selectedVariant.type;
                }

                const orderItemId = makeUuid("e0e0e0e0", index * 10 + offset);

                additionalOrderItems.push({
                    id: orderItemId,
                    name: menu.title,
                    quantity,
                    price: unitPrice,
                    notes: (index + offset) % 8 === 0 ? "No chili flakes" : null,
                    variantType,
                    orderId,
                    menuItemId: menu.id,
                    variantId,
                    lastUpdatedBy: index % 2 === 0 ? ids.users.waiter : ids.users.manager,
                });

                orderTotal += unitPrice * quantity;

                if (menu.addons.length > 0 && (index + offset) % 5 === 0) {
                    const addon = menu.addons[(index + offset) % menu.addons.length];
                    additionalOrderItemAddons.push({
                        id: makeUuid("f0f0f0f0", addonSerial),
                        name: addon.name,
                        price: addon.price,
                        orderItemId,
                        addonId: addon.id,
                        lastUpdatedBy: ids.users.waiter,
                    });
                    addonSerial += 1;
                    orderTotal += addon.price * quantity;
                }
            }

            const resolvedPaymentStatus =
                orderStatus === "CANCELLED" ? "REFUNDED" : ["PENDING", "CONFIRMED", "PREPARING", "READY"].includes(orderStatus) ? "PENDING" : "COMPLETED";

            additionalOrders.push({
                id: orderId,
                status: orderStatus,
                totalPrice: roundMoney(orderTotal),
                paymentMethod,
                paymentStatus: resolvedPaymentStatus,
                notes: `Bulk mock order #${index}`,
                estimatedDeliveryTimeInMinutes: 15 + (index % 26),
                customerId,
                restaurantId: ids.restaurant,
                tenantId: ids.tenant,
                tableId,
                orderType,
                couponId: null,
                lastUpdatedBy: index % 2 === 0 ? ids.users.manager : ids.users.waiter,
            });

            additionalPayments.push({
                id: makeUuid("13131314", index),
                transactionId:
                    paymentMethod === "CASH" || resolvedPaymentStatus === "PENDING"
                        ? null
                        : `TXN-BULK-${String(index).padStart(4, "0")}`,
                amount: roundMoney(orderTotal),
                currency: "BDT",
                method: paymentMethod,
                status: resolvedPaymentStatus,
                gatewayResponse:
                    resolvedPaymentStatus === "PENDING"
                        ? null
                        : { provider: paymentMethod === "ONLINE_PAYMENT" ? "sslcommerz" : "mock-gateway", ref: `bulk_${index}` },
                paidAt: resolvedPaymentStatus === "PENDING" ? null : new Date(Date.UTC(2026, 2, 1 + (index % 20), 10 + (index % 10), index % 60)),
                failureReason: resolvedPaymentStatus === "REFUNDED" ? "Order cancelled after online prepayment" : null,
                orderId,
                customerId,
                restaurantId: ids.restaurant,
                tenantId: ids.tenant,
                lastUpdatedBy: ids.users.manager,
            });
        }

        await tx.order.createMany({
            data: [
                {
                    id: ids.orders.order1,
                    status: "COMPLETED",
                    totalPrice: 620,
                    paymentMethod: "CARD",
                    paymentStatus: "COMPLETED",
                    notes: "No onion",
                    estimatedDeliveryTimeInMinutes: 25,
                    customerId: ids.users.customer1,
                    restaurantId: ids.restaurant,
                    tenantId: ids.tenant,
                    tableId: ids.tables.t2,
                    orderType: "DINE_IN",
                    couponId: ids.coupons.welcome10,
                    lastUpdatedBy: ids.users.waiter,
                },
                {
                    id: ids.orders.order2,
                    status: "DELIVERED",
                    totalPrice: 390,
                    paymentMethod: "MOBILE_PAYMENT",
                    paymentStatus: "COMPLETED",
                    notes: "Ring the bell",
                    estimatedDeliveryTimeInMinutes: 35,
                    customerId: ids.users.customer2,
                    restaurantId: ids.restaurant,
                    tenantId: ids.tenant,
                    tableId: null,
                    orderType: "DELIVERY",
                    couponId: ids.coupons.flat5,
                    lastUpdatedBy: ids.users.manager,
                },
                {
                    id: ids.orders.order3,
                    status: "READY",
                    totalPrice: 280,
                    paymentMethod: "CASH",
                    paymentStatus: "PENDING",
                    notes: "Takeaway pickup at counter",
                    estimatedDeliveryTimeInMinutes: 12,
                    customerId: ids.users.customer3,
                    restaurantId: ids.restaurant,
                    tenantId: ids.tenant,
                    tableId: null,
                    orderType: "TAKEAWAY",
                    couponId: null,
                    lastUpdatedBy: ids.users.waiter,
                },
                {
                    id: ids.orders.order4,
                    status: "CANCELLED",
                    totalPrice: 190,
                    paymentMethod: "ONLINE_PAYMENT",
                    paymentStatus: "REFUNDED",
                    notes: "Customer cancelled before preparation",
                    estimatedDeliveryTimeInMinutes: 20,
                    customerId: ids.users.customer1,
                    restaurantId: ids.restaurant,
                    tenantId: ids.tenant,
                    tableId: null,
                    orderType: "DELIVERY",
                    couponId: null,
                    lastUpdatedBy: ids.users.manager,
                },
                ...additionalOrders,
            ],
        });

        await tx.orderItem.createMany({
            data: [
                {
                    id: ids.orderItems.o1Item1,
                    name: "Grilled Chicken Bowl",
                    quantity: 1,
                    price: 450,
                    notes: "extra grilled",
                    variantType: "LARGE",
                    orderId: ids.orders.order1,
                    menuItemId: ids.menuProducts.grilledChicken,
                    variantId: ids.variants.chickenLarge,
                    lastUpdatedBy: ids.users.waiter,
                },
                {
                    id: ids.orderItems.o1Item2,
                    name: "House Cola",
                    quantity: 1,
                    price: 160,
                    notes: null,
                    variantType: "LARGE",
                    orderId: ids.orders.order1,
                    menuItemId: ids.menuProducts.cola,
                    variantId: ids.variants.colaLarge,
                    lastUpdatedBy: ids.users.waiter,
                },
                {
                    id: ids.orderItems.o2Item1,
                    name: "Garden Veggie Salad",
                    quantity: 1,
                    price: 220,
                    notes: "light dressing",
                    variantType: null,
                    orderId: ids.orders.order2,
                    menuItemId: ids.menuProducts.vegSalad,
                    variantId: null,
                    lastUpdatedBy: ids.users.manager,
                },
                {
                    id: ids.orderItems.o2Item2,
                    name: "Chocolate Cheese Cake",
                    quantity: 1,
                    price: 220,
                    notes: null,
                    variantType: null,
                    orderId: ids.orders.order2,
                    menuItemId: ids.menuProducts.chocoCake,
                    variantId: null,
                    lastUpdatedBy: ids.users.manager,
                },
                {
                    id: ids.orderItems.o3Item1,
                    name: "Chocolate Cheese Cake",
                    quantity: 1,
                    price: 280,
                    notes: null,
                    variantType: null,
                    orderId: ids.orders.order3,
                    menuItemId: ids.menuProducts.chocoCake,
                    variantId: null,
                    lastUpdatedBy: ids.users.waiter,
                },
                {
                    id: ids.orderItems.o4Item1,
                    name: "House Cola",
                    quantity: 1,
                    price: 190,
                    notes: "less ice",
                    variantType: "LARGE",
                    orderId: ids.orders.order4,
                    menuItemId: ids.menuProducts.cola,
                    variantId: ids.variants.colaLarge,
                    lastUpdatedBy: ids.users.manager,
                },
                ...additionalOrderItems,
            ],
        });

        await tx.orderItemAddon.createMany({
            data: [
                {
                    id: ids.orderItemAddons.o1Addon1,
                    name: "Extra Cheese",
                    price: 40,
                    orderItemId: ids.orderItems.o1Item1,
                    addonId: ids.addons.extraCheese,
                    lastUpdatedBy: ids.users.waiter,
                },
                {
                    id: ids.orderItemAddons.o2Addon1,
                    name: "Spicy Sauce",
                    price: 20,
                    orderItemId: ids.orderItems.o2Item1,
                    addonId: ids.addons.extraSauce,
                    lastUpdatedBy: ids.users.manager,
                },
                {
                    id: ids.orderItemAddons.o4Addon1,
                    name: "Lemon Slice",
                    price: 10,
                    orderItemId: ids.orderItems.o4Item1,
                    addonId: ids.addons.lemonSlice,
                    lastUpdatedBy: ids.users.manager,
                },
                ...additionalOrderItemAddons,
            ],
        });

        await tx.couponUsage.createMany({
            data: [
                {
                    id: ids.couponUsages.usage1,
                    couponId: ids.coupons.welcome10,
                    customerId: ids.users.customer1,
                    orderId: ids.orders.order1,
                },
                {
                    id: ids.couponUsages.usage2,
                    couponId: ids.coupons.flat5,
                    customerId: ids.users.customer2,
                    orderId: ids.orders.order2,
                },
            ],
        });

        await tx.payment.createMany({
            data: [
                {
                    id: ids.payments.p1,
                    transactionId: "TXN-ORDER1-20260306",
                    amount: 620,
                    currency: "BDT",
                    method: "CARD",
                    status: "COMPLETED",
                    gatewayResponse: { provider: "stripe", chargeId: "ch_demo_order1" },
                    paidAt: new Date("2026-03-06T12:10:00.000Z"),
                    failureReason: null,
                    orderId: ids.orders.order1,
                    customerId: ids.users.customer1,
                    restaurantId: ids.restaurant,
                    tenantId: ids.tenant,
                    lastUpdatedBy: ids.users.manager,
                },
                {
                    id: ids.payments.p2,
                    transactionId: "TXN-ORDER2-20260306",
                    amount: 390,
                    currency: "BDT",
                    method: "MOBILE_PAYMENT",
                    status: "COMPLETED",
                    gatewayResponse: { provider: "bkash", trxId: "bkash_demo_order2" },
                    paidAt: new Date("2026-03-06T13:22:00.000Z"),
                    failureReason: null,
                    orderId: ids.orders.order2,
                    customerId: ids.users.customer2,
                    restaurantId: ids.restaurant,
                    tenantId: ids.tenant,
                    lastUpdatedBy: ids.users.manager,
                },
                {
                    id: ids.payments.p3,
                    transactionId: null,
                    amount: 280,
                    currency: "BDT",
                    method: "CASH",
                    status: "PENDING",
                    gatewayResponse: null,
                    paidAt: null,
                    failureReason: null,
                    orderId: ids.orders.order3,
                    customerId: ids.users.customer3,
                    restaurantId: ids.restaurant,
                    tenantId: ids.tenant,
                    lastUpdatedBy: ids.users.waiter,
                },
                {
                    id: ids.payments.p4,
                    transactionId: "TXN-ORDER4-20260306",
                    amount: 190,
                    currency: "BDT",
                    method: "ONLINE_PAYMENT",
                    status: "REFUNDED",
                    gatewayResponse: { provider: "sslcommerz", refundId: "refund_demo_order4" },
                    paidAt: new Date("2026-03-06T13:45:00.000Z"),
                    failureReason: "Customer requested cancellation",
                    orderId: ids.orders.order4,
                    customerId: ids.users.customer1,
                    restaurantId: ids.restaurant,
                    tenantId: ids.tenant,
                    lastUpdatedBy: ids.users.manager,
                },
                ...additionalPayments,
            ],
        });

        await tx.reservation.createMany({
            data: [
                {
                    id: ids.reservations.r1,
                    scheduledFor: new Date("2026-03-07T13:00:00.000Z"),
                    duration: 90,
                    partySize: 2,
                    status: "CONFIRMED",
                    notes: "Window seat",
                    contactPhone: "+8801700001111",
                    customerId: ids.users.customer1,
                    tableId: ids.tables.t1,
                    restaurantId: ids.restaurant,
                    tenantId: ids.tenant,
                    lastUpdatedBy: ids.users.waiter,
                },
                {
                    id: ids.reservations.r2,
                    scheduledFor: new Date("2026-03-07T14:00:00.000Z"),
                    duration: 60,
                    partySize: 4,
                    status: "PENDING",
                    notes: "Birthday setup",
                    contactPhone: "+8801700002222",
                    customerId: ids.users.customer2,
                    tableId: ids.tables.t2,
                    restaurantId: ids.restaurant,
                    tenantId: ids.tenant,
                    lastUpdatedBy: ids.users.waiter,
                },
                {
                    id: ids.reservations.r3,
                    scheduledFor: new Date("2026-03-08T12:30:00.000Z"),
                    duration: 120,
                    partySize: 6,
                    status: "SEATED",
                    notes: null,
                    contactPhone: "+8801700003333",
                    customerId: ids.users.customer3,
                    tableId: ids.tables.t3,
                    restaurantId: ids.restaurant,
                    tenantId: ids.tenant,
                    lastUpdatedBy: ids.users.manager,
                },
            ],
        });

        await tx.review.createMany({
            data: [
                {
                    id: ids.reviews.rev1,
                    rating: 4.7,
                    comment: "Very tasty and quick service.",
                    sentiment: "positive",
                    customerId: ids.users.customer1,
                    orderId: ids.orders.order1,
                    menuProductId: ids.menuProducts.grilledChicken,
                    lastUpdatedBy: ids.users.customer1,
                },
                {
                    id: ids.reviews.rev2,
                    rating: 4.2,
                    comment: "Fresh salad, decent portion.",
                    sentiment: "positive",
                    customerId: ids.users.customer2,
                    orderId: ids.orders.order2,
                    menuProductId: ids.menuProducts.vegSalad,
                    lastUpdatedBy: ids.users.customer2,
                },
                {
                    id: ids.reviews.rev3,
                    rating: 4.5,
                    comment: "Cake was rich and delicious.",
                    sentiment: "positive",
                    customerId: ids.users.customer2,
                    orderId: ids.orders.order2,
                    menuProductId: ids.menuProducts.chocoCake,
                    lastUpdatedBy: ids.users.customer2,
                },
            ],
        });
    });

    console.log("✅ Database seeded with consistent mock data for all models.");
}

main()
    .catch((error) => {
        console.error("❌ Seed failed:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
