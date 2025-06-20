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
    "dateHired" TEXT,
    "dateReleased" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Driver" ("createdAt", "dateHired", "dateReleased", "defaultTruck", "endDumpPayRate", "firstName", "flatBedPayRate", "id", "isActive", "lastName", "nonCommissionRate", "updatedAt") SELECT "createdAt", "dateHired", "dateReleased", "defaultTruck", "endDumpPayRate", "firstName", "flatBedPayRate", "id", "isActive", "lastName", "nonCommissionRate", "updatedAt" FROM "Driver";
DROP TABLE "Driver";
ALTER TABLE "new_Driver" RENAME TO "Driver";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
