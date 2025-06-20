-- CreateTable
CREATE TABLE "Driver" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "defaultTruck" TEXT NOT NULL,
    "endDumpPayRate" REAL NOT NULL,
    "flatBedPayRate" REAL NOT NULL,
    "nonCommissionRate" REAL NOT NULL,
    "dateHired" DATETIME,
    "dateReleased" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
