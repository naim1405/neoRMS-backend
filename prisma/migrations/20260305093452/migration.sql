/*
  Warnings:

  - A unique constraint covering the columns `[customerId,orderId,menuProductId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orderId` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Review_customerId_menuProductId_key";

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "orderId" TEXT NOT NULL,
ADD COLUMN     "sentimetn" TEXT;

-- CreateIndex
CREATE INDEX "Review_orderId_idx" ON "Review"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_customerId_orderId_menuProductId_key" ON "Review"("customerId", "orderId", "menuProductId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
