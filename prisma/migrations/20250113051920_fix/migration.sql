-- AlterTable
ALTER TABLE `location` ADD COLUMN `address` VARCHAR(3000) NULL,
    ADD COLUMN `date` VARCHAR(191) NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL,
    MODIFY `map` VARCHAR(3000) NULL;
