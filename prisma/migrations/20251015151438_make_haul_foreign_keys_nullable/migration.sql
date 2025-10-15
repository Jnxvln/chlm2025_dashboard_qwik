-- DropForeignKey
ALTER TABLE "Haul" DROP CONSTRAINT "Haul_freightRouteId_fkey";

-- DropForeignKey
ALTER TABLE "Haul" DROP CONSTRAINT "Haul_vendorProductId_fkey";

-- AlterTable
ALTER TABLE "Haul" ALTER COLUMN "vendorProductId" DROP NOT NULL,
ALTER COLUMN "freightRouteId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Haul" ADD CONSTRAINT "Haul_freightRouteId_fkey" FOREIGN KEY ("freightRouteId") REFERENCES "FreightRoute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Haul" ADD CONSTRAINT "Haul_vendorProductId_fkey" FOREIGN KEY ("vendorProductId") REFERENCES "VendorProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
