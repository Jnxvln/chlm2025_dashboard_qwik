/*
  Warnings:

  - You are about to drop the column `invoice` on the `Haul` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Haul" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dateHaul" DATETIME NOT NULL,
    "truck" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "chInvoice" TEXT,
    "loadType" TEXT NOT NULL,
    "loadRefNum" TEXT,
    "vendorProductId" INTEGER NOT NULL,
    "freightRouteId" INTEGER NOT NULL,
    "rateMetric" TEXT NOT NULL,
    "rate" REAL NOT NULL,
    "quantity" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workdayId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    CONSTRAINT "Haul_vendorProductId_fkey" FOREIGN KEY ("vendorProductId") REFERENCES "VendorProduct" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Haul_freightRouteId_fkey" FOREIGN KEY ("freightRouteId") REFERENCES "FreightRoute" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Haul_workdayId_fkey" FOREIGN KEY ("workdayId") REFERENCES "Workday" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Haul_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Haul" ("chInvoice", "createdAt", "createdById", "customer", "dateHaul", "freightRouteId", "id", "loadType", "quantity", "rate", "rateMetric", "truck", "updatedAt", "vendorProductId", "workdayId") SELECT "chInvoice", "createdAt", "createdById", "customer", "dateHaul", "freightRouteId", "id", "loadType", "quantity", "rate", "rateMetric", "truck", "updatedAt", "vendorProductId", "workdayId" FROM "Haul";
DROP TABLE "Haul";
ALTER TABLE "new_Haul" RENAME TO "Haul";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
