/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `VendorLocation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "VendorLocation_name_key" ON "VendorLocation"("name");
