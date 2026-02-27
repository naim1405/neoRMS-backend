/*
  Warnings:

  - You are about to drop the `Ingredient` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "IngredientUnit" AS ENUM ('GRAM', 'KILOGRAM', 'LITER', 'MILLILITER', 'PIECE');

-- DropForeignKey
ALTER TABLE "Ingredient" DROP CONSTRAINT "Ingredient_menuProductId_fkey";

-- DropTable
DROP TABLE "Ingredient";

-- CreateTable
CREATE TABLE "InventoryIngredient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" "IngredientUnit" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantInventory" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "availableQuantity" DOUBLE PRECISION NOT NULL,
    "thresholdQuantity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuProductIngredient" (
    "id" TEXT NOT NULL,
    "menuProductId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "requiredQuantity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuProductIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InventoryIngredient_name_key" ON "InventoryIngredient"("name");

-- CreateIndex
CREATE INDEX "RestaurantInventory_restaurantId_idx" ON "RestaurantInventory"("restaurantId");

-- CreateIndex
CREATE INDEX "RestaurantInventory_ingredientId_idx" ON "RestaurantInventory"("ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantInventory_restaurantId_ingredientId_key" ON "RestaurantInventory"("restaurantId", "ingredientId");

-- CreateIndex
CREATE INDEX "MenuProductIngredient_menuProductId_idx" ON "MenuProductIngredient"("menuProductId");

-- CreateIndex
CREATE INDEX "MenuProductIngredient_ingredientId_idx" ON "MenuProductIngredient"("ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuProductIngredient_menuProductId_ingredientId_key" ON "MenuProductIngredient"("menuProductId", "ingredientId");

-- AddForeignKey
ALTER TABLE "RestaurantInventory" ADD CONSTRAINT "RestaurantInventory_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantInventory" ADD CONSTRAINT "RestaurantInventory_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "InventoryIngredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuProductIngredient" ADD CONSTRAINT "MenuProductIngredient_menuProductId_fkey" FOREIGN KEY ("menuProductId") REFERENCES "MenuProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuProductIngredient" ADD CONSTRAINT "MenuProductIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "InventoryIngredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
