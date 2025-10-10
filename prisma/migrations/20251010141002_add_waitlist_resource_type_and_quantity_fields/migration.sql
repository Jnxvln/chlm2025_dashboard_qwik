/*
  Warnings:

  - You are about to drop the column `email` on the `WaitlistEntry` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `WaitlistEntry` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `WaitlistEntry` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `WaitlistEntry` table. All the data in the column will be lost.
  - You are about to drop the column `resource` on the `WaitlistEntry` table. All the data in the column will be lost.
  - The `status` column on the `WaitlistEntry` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `contactId` to the `WaitlistEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resourceType` to the `WaitlistEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `WaitlistEntry` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('waiting', 'contacted', 'fulfilled', 'cancelled');

-- AlterTable
ALTER TABLE "WaitlistEntry" DROP COLUMN "email",
DROP COLUMN "firstName",
DROP COLUMN "lastName",
DROP COLUMN "phone",
DROP COLUMN "resource",
ADD COLUMN     "contactId" INTEGER NOT NULL,
ADD COLUMN     "customResourceName" TEXT,
ADD COLUMN     "quantityUnit" TEXT,
ADD COLUMN     "resourceType" TEXT NOT NULL,
ADD COLUMN     "vendorProductId" INTEGER,
DROP COLUMN "quantity",
ADD COLUMN     "quantity" INTEGER NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "WaitlistStatus" NOT NULL DEFAULT 'waiting';

-- CreateTable
CREATE TABLE "Contact" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "companyName" TEXT,
    "phone1" TEXT NOT NULL,
    "phone2" TEXT,
    "email1" TEXT,
    "email2" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WaitlistEntry_contactId_idx" ON "WaitlistEntry"("contactId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_vendorProductId_idx" ON "WaitlistEntry"("vendorProductId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_status_idx" ON "WaitlistEntry"("status");

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_vendorProductId_fkey" FOREIGN KEY ("vendorProductId") REFERENCES "VendorProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
