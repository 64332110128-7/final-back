/*
  Warnings:

  - You are about to drop the column `planId` on the `location` table. All the data in the column will be lost.
  - Added the required column `locationId` to the `Plan` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `location` DROP FOREIGN KEY `Location_planId_fkey`;

-- AlterTable
ALTER TABLE `location` DROP COLUMN `planId`;

-- AlterTable
ALTER TABLE `plan` ADD COLUMN `locationId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Plan` ADD CONSTRAINT `Plan_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `Location`(`locationId`) ON DELETE CASCADE ON UPDATE CASCADE;
