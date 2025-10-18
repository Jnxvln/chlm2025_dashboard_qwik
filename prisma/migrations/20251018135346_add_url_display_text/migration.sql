/*
  Warnings:

  - Added the required column `displayText` to the `URL` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "URL" DROP CONSTRAINT "URL_noticeId_fkey";

-- DropIndex
DROP INDEX "URL_url_key";

-- AlterTable
ALTER TABLE "URL" ADD COLUMN     "displayText" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "URL" ADD CONSTRAINT "URL_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "Notice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
