/*
  Warnings:

  - You are about to drop the `review` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reviewimg` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reviewrating` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `review` DROP FOREIGN KEY `Review_userId_fkey`;

-- DropForeignKey
ALTER TABLE `reviewimg` DROP FOREIGN KEY `ReviewImg_reviewId_fkey`;

-- DropForeignKey
ALTER TABLE `reviewrating` DROP FOREIGN KEY `ReviewRating_reviewId_fkey`;

-- DropTable
DROP TABLE `review`;

-- DropTable
DROP TABLE `reviewimg`;

-- DropTable
DROP TABLE `reviewrating`;
