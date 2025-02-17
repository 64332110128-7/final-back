/*
  Warnings:

  - A unique constraint covering the columns `[filename]` on the table `LocationCommentImg` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `locationcommentimg` ADD COLUMN `filename` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `LocationCommentImg_filename_key` ON `LocationCommentImg`(`filename`);
