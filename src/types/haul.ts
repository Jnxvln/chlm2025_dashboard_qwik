/**
 * Type definitions for haul (delivery) entities
 */

/**
 * Load type options for hauls
 */
export type LoadType = 'enddump' | 'flatbed';

/**
 * Haul entity representing a delivery/truck run
 */
export interface Haul {
  id: number;
  workdayId: number;
  /** Foreign key to vendor product */
  vendorProductId: number;
  /** Quantity delivered */
  quantity: number; // Decimal type from database
  /** Rate paid to driver */
  rate: number; // Decimal type from database
  /** Type of truck/load */
  loadType: LoadType;
  /** Truck identification number */
  truckNumber: string | null;
  /** Delivery notes */
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: number;
  /** Associated workday */
  workday?: any; // Workday type from workday.ts
  /** Product delivered */
  vendorProduct?: any; // VendorProduct type from vendor.ts
  /** User who created this haul */
  createdBy?: any; // User type from user.ts
}
