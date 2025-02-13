-- AlterTable
ALTER TABLE `location` ADD COLUMN `averageScore` DOUBLE NULL;

-- AlterTable
ALTER TABLE `locationscore` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `userId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `LocationScore` ADD CONSTRAINT `LocationScore_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;
