/*
  Warnings:

  - You are about to drop the column `averageScore` on the `location` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `location` DROP COLUMN `averageScore`,
    ADD COLUMN `average_score` DOUBLE NULL;
