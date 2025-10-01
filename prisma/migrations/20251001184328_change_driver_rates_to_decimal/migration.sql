/*
  Warnings:

  - You are about to alter the column `driverDefaultNCPayRate` on the `Settings` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `driverDefaultHolidayPayRate` on the `Settings` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE "Settings" ALTER COLUMN "driverDefaultNCPayRate" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "driverDefaultHolidayPayRate" SET DATA TYPE DECIMAL(10,2);
