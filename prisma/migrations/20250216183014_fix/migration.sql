/*
  Warnings:

  - A unique constraint covering the columns `[userId,locationId]` on the table `LocationScore` will be added. If there are existing duplicate values, this will fail.
  - Made the column `userId` on table `locationscore` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `locationscore` DROP FOREIGN KEY `LocationScore_userId_fkey`;

-- AlterTable
ALTER TABLE `locationcomment` ADD COLUMN `parentId` INTEGER NULL;

-- AlterTable
ALTER TABLE `locationscore` MODIFY `userId` INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `LocationScore_userId_locationId_key` ON `LocationScore`(`userId`, `locationId`);

-- AddForeignKey
ALTER TABLE `LocationScore` ADD CONSTRAINT `LocationScore_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LocationComment` ADD CONSTRAINT `LocationComment_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `LocationComment`(`commentId`) ON DELETE CASCADE ON UPDATE CASCADE;
