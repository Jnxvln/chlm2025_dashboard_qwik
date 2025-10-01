-- CreateTable
CREATE TABLE "Settings" (
    "id" SERIAL NOT NULL,
    "storeOpen" BOOLEAN NOT NULL DEFAULT true,
    "storeDefaultClosureReason" TEXT NOT NULL DEFAULT 'C&H is currently closed',
    "storeDefaultClosureReasonWeather" TEXT NOT NULL DEFAULT 'C&H is closed due to weather',
    "storeDefaultClosureReasonHoliday" TEXT NOT NULL DEFAULT 'C&H is closed for the holiday',
    "storeDisplayInventoryStatus" BOOLEAN NOT NULL DEFAULT true,
    "operatingHoursMonFriStart" TEXT NOT NULL DEFAULT '08:00',
    "operatingHoursMonFriEnd" TEXT NOT NULL DEFAULT '17:00',
    "operatingHoursSatStart" TEXT NOT NULL DEFAULT '08:00',
    "operatingHoursSatEnd" TEXT NOT NULL DEFAULT '12:00',
    "operatingHoursSunStart" TEXT NOT NULL DEFAULT 'CLOSED',
    "operatingHoursSunEnd" TEXT NOT NULL DEFAULT 'CLOSED',
    "driverDefaultNCPayRate" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "driverDefaultHolidayPayRate" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "userPrefersCaps" BOOLEAN NOT NULL DEFAULT false,
    "userDefaultColorTheme" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);
