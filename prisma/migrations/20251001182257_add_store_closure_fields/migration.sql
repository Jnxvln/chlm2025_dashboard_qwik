-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "storeClosureType" TEXT NOT NULL DEFAULT 'default',
ADD COLUMN     "storeCustomClosureMessage" TEXT;
