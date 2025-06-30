/*
  Warnings:

  - You are about to alter the column `dateHired` on the `Driver` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.
  - You are about to alter the column `dateReleased` on the `Driver` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.

*/
-- CreateTable
CREATE TABLE "Workday" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "chHours" REAL NOT NULL,
    "ncHours" REAL NOT NULL,
    "ncReasons" TEXT,
    "notes" TEXT,
    "offDuty" BOOLEAN NOT NULL DEFAULT false,
    "offDutyReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "driverId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    CONSTRAINT "Workday_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Workday_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Haul" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dateHaul" DATETIME NOT NULL,
    "truck" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "chInvoice" TEXT,
    "loadType" TEXT NOT NULL,
    "invoice" TEXT,
    "vendorProductId" INTEGER NOT NULL,
    "freightRouteId" INTEGER NOT NULL,
    "tons" REAL NOT NULL,
    "rate" REAL NOT NULL,
    "miles" REAL NOT NULL,
    "payRate" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workdayId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    CONSTRAINT "Haul_vendorProductId_fkey" FOREIGN KEY ("vendorProductId") REFERENCES "VendorProduct" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Haul_freightRouteId_fkey" FOREIGN KEY ("freightRouteId") REFERENCES "FreightRoute" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Haul_workdayId_fkey" FOREIGN KEY ("workdayId") REFERENCES "Workday" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Haul_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FreightRoute" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "destination" TEXT NOT NULL,
    "freightCost" REAL NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vendorLocationId" INTEGER NOT NULL,
    CONSTRAINT "FreightRoute_vendorLocationId_fkey" FOREIGN KEY ("vendorLocationId") REFERENCES "VendorLocation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Driver" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "defaultTruck" TEXT,
    "endDumpPayRate" REAL NOT NULL,
    "flatBedPayRate" REAL NOT NULL,
    "nonCommissionRate" REAL NOT NULL,
    "dateHired" DATETIME,
    "dateReleased" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Driver" ("createdAt", "dateHired", "dateReleased", "defaultTruck", "endDumpPayRate", "firstName", "flatBedPayRate", "id", "isActive", "lastName", "nonCommissionRate", "updatedAt") SELECT "createdAt", "dateHired", "dateReleased", "defaultTruck", "endDumpPayRate", "firstName", "flatBedPayRate", "id", "isActive", "lastName", "nonCommissionRate", "updatedAt" FROM "Driver";
DROP TABLE "Driver";
ALTER TABLE "new_Driver" RENAME TO "Driver";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
