-- AlterTable
ALTER TABLE "FreightRoute" ADD COLUMN     "deactivatedByParent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Material" ADD COLUMN     "deactivatedByParent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "VendorLocation" ADD COLUMN     "deactivatedByParent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "VendorProduct" ADD COLUMN     "deactivatedByParent" BOOLEAN NOT NULL DEFAULT false;
