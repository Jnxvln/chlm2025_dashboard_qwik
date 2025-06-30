/*
  Warnings:

  - You are about to alter the column `date` on the `Workday` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Workday" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
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
INSERT INTO "new_Workday" ("chHours", "createdAt", "createdById", "date", "driverId", "id", "ncHours", "ncReasons", "notes", "offDuty", "offDutyReason", "updatedAt") SELECT "chHours", "createdAt", "createdById", "date", "driverId", "id", "ncHours", "ncReasons", "notes", "offDuty", "offDutyReason", "updatedAt" FROM "Workday";
DROP TABLE "Workday";
ALTER TABLE "new_Workday" RENAME TO "Workday";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
