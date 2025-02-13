/*
  Warnings:

  - You are about to alter the column `budget` on the `location` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(1))` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `location` MODIFY `budget` VARCHAR(191) NULL,
    MODIFY `price` VARCHAR(191) NULL;
