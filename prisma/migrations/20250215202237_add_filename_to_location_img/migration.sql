/*
  Warnings:

  - A unique constraint covering the columns `[filename]` on the table `LocationImg` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `locationimg` ADD COLUMN `filename` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `LocationImg_filename_key` ON `LocationImg`(`filename`);
