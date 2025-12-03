/*
  Warnings:

  - You are about to drop the `Shop` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `shopId` on the `Shipment` table. All the data in the column will be lost.
  - You are about to drop the column `trackingData` on the `Shipment` table. All the data in the column will be lost.
  - Added the required column `shop` to the `Shipment` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Shop_shop_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Shop";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "ShopConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "xUsername" TEXT,
    "xPassword" TEXT,
    "environment" TEXT NOT NULL DEFAULT 'test',
    "senderName" TEXT,
    "senderAddress" TEXT,
    "senderPostal" TEXT,
    "senderPhone" TEXT,
    "senderContact" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Shipment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderName" TEXT NOT NULL,
    "sifraExt" TEXT NOT NULL,
    "sifra" TEXT,
    "status" TEXT,
    "trackingRaw" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Shipment" ("createdAt", "id", "orderId", "orderName", "sifra", "sifraExt", "status", "updatedAt") SELECT "createdAt", "id", "orderId", "orderName", "sifra", "sifraExt", "status", "updatedAt" FROM "Shipment";
DROP TABLE "Shipment";
ALTER TABLE "new_Shipment" RENAME TO "Shipment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ShopConfig_shop_key" ON "ShopConfig"("shop");
