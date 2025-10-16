-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "offDutyReasonBereavement" TEXT NOT NULL DEFAULT 'Bereavement',
ADD COLUMN     "offDutyReasonMaintenance" TEXT NOT NULL DEFAULT 'Maintenance',
ADD COLUMN     "offDutyReasonNoWork" TEXT NOT NULL DEFAULT 'No Work',
ADD COLUMN     "offDutyReasonPersonal" TEXT NOT NULL DEFAULT 'Personal',
ADD COLUMN     "offDutyReasonSick" TEXT NOT NULL DEFAULT 'Sick',
ADD COLUMN     "offDutyReasonVacation" TEXT NOT NULL DEFAULT 'Vacation',
ADD COLUMN     "offDutyReasonWeather" TEXT NOT NULL DEFAULT 'Weather';
