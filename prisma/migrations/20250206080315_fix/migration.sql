/*
  Warnings:

  - You are about to alter the column `budget` on the `location` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(1))`.
  - You are about to alter the column `price` on the `location` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- AlterTable
ALTER TABLE `location` MODIFY `budget` ENUM('LOW', 'MEDIUM', 'HIGH') NULL,
    MODIFY `price` INTEGER NULL;
