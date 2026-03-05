/*
  Warnings:

  - You are about to drop the column `sentimetn` on the `Review` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Review" DROP COLUMN "sentimetn",
ADD COLUMN     "sentiment" TEXT;
