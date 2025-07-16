/*
  Warnings:

  - A unique constraint covering the columns `[driverId,date]` on the table `Workday` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Workday_driverId_date_key" ON "Workday"("driverId", "date");
