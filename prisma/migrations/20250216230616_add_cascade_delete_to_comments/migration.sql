/*
  Warnings:

  - Added the required column `commentId` to the `LocationScore` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `locationscore` ADD COLUMN `commentId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `LocationScore` ADD CONSTRAINT `LocationScore_commentId_fkey` FOREIGN KEY (`commentId`) REFERENCES `LocationComment`(`commentId`) ON DELETE CASCADE ON UPDATE CASCADE;
