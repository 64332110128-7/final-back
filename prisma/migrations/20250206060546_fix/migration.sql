-- AlterTable
ALTER TABLE `location` ADD COLUMN `budget` VARCHAR(191) NULL,
    ADD COLUMN `price` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `LocationComment` (
    `commentId` INTEGER NOT NULL AUTO_INCREMENT,
    `text` VARCHAR(3000) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` INTEGER NOT NULL,
    `locationId` INTEGER NOT NULL,

    PRIMARY KEY (`commentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LocationCommentImg` (
    `imgId` INTEGER NOT NULL AUTO_INCREMENT,
    `url` VARCHAR(191) NOT NULL,
    `commentId` INTEGER NOT NULL,

    PRIMARY KEY (`imgId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LocationComment` ADD CONSTRAINT `LocationComment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LocationComment` ADD CONSTRAINT `LocationComment_locationId_fkey` FOREIGN KEY (`locationId`) REFERENCES `Location`(`locationId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LocationCommentImg` ADD CONSTRAINT `LocationCommentImg_commentId_fkey` FOREIGN KEY (`commentId`) REFERENCES `LocationComment`(`commentId`) ON DELETE CASCADE ON UPDATE CASCADE;
