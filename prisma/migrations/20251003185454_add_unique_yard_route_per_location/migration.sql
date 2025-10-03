-- CreateIndex
CREATE INDEX "FreightRoute_vendorLocationId_toYard_idx" ON "FreightRoute"("vendorLocationId", "toYard");

-- Create unique partial index to ensure only one yard route per vendor location
CREATE UNIQUE INDEX "FreightRoute_unique_yard_per_location" ON "FreightRoute"("vendorLocationId") WHERE "toYard" = true;
