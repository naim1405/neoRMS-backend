-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('AVAILABLE', 'OUT_OF_STOCK', 'DISCONTINUED', 'DRAFT');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('STARTER', 'MAIN_COURSE', 'DESSERT', 'BEVERAGE', 'SIDE');

-- CreateEnum
CREATE TYPE "DietaryTag" AS ENUM ('VEGETARIAN', 'VEGAN', 'HALAL', 'GLUTEN_FREE', 'DAIRY_FREE', 'NUT_FREE');

-- CreateEnum
CREATE TYPE "VariantType" AS ENUM ('SMALL', 'MEDIUM', 'LARGE', 'FAMILY', 'SPECIAL');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'EUR', 'GBP', 'BDT', 'INR');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'CUSTOMER';
ALTER TYPE "UserRole" ADD VALUE 'OWNER';

-- CreateTable
CREATE TABLE "AssociatedRestaurant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssociatedRestaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Restaurant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "location" TEXT,
    "contactInfo" TEXT,
    "bannerImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuProduct" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "productDescription" TEXT,
    "estimatedCookingTime" INTEGER,
    "userRating" DOUBLE PRECISION,
    "aiRating" DOUBLE PRECISION,
    "status" "ProductStatus" NOT NULL,
    "priceCurrency" "Currency" NOT NULL,
    "category" "Category" NOT NULL,
    "dietaryTags" "DietaryTag"[],
    "images" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "menuProductId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "menuProductId" TEXT NOT NULL,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Variant" (
    "id" TEXT NOT NULL,
    "type" "VariantType" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION,
    "menuProductId" TEXT NOT NULL,

    CONSTRAINT "Variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Addon" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "menuProductId" TEXT NOT NULL,

    CONSTRAINT "Addon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssociatedRestaurant_userId_idx" ON "AssociatedRestaurant"("userId");

-- CreateIndex
CREATE INDEX "AssociatedRestaurant_restaurantId_idx" ON "AssociatedRestaurant"("restaurantId");

-- CreateIndex
CREATE INDEX "MenuProduct_restaurantId_idx" ON "MenuProduct"("restaurantId");

-- CreateIndex
CREATE INDEX "Review_menuProductId_idx" ON "Review"("menuProductId");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

-- CreateIndex
CREATE INDEX "Ingredient_menuProductId_idx" ON "Ingredient"("menuProductId");

-- CreateIndex
CREATE INDEX "Variant_menuProductId_idx" ON "Variant"("menuProductId");

-- CreateIndex
CREATE INDEX "Addon_menuProductId_idx" ON "Addon"("menuProductId");

-- AddForeignKey
ALTER TABLE "AssociatedRestaurant" ADD CONSTRAINT "AssociatedRestaurant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssociatedRestaurant" ADD CONSTRAINT "AssociatedRestaurant_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuProduct" ADD CONSTRAINT "MenuProduct_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_menuProductId_fkey" FOREIGN KEY ("menuProductId") REFERENCES "MenuProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_menuProductId_fkey" FOREIGN KEY ("menuProductId") REFERENCES "MenuProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_menuProductId_fkey" FOREIGN KEY ("menuProductId") REFERENCES "MenuProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Addon" ADD CONSTRAINT "Addon_menuProductId_fkey" FOREIGN KEY ("menuProductId") REFERENCES "MenuProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
