/**
 * Type definitions for vendor-related entities
 */

/**
 * Vendor entity representing a supplier or material source
 */
export interface Vendor {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  /** Related vendor locations */
  vendorLocations?: VendorLocation[];
  /** Related vendor products */
  vendorProducts?: VendorProduct[];
}

/**
 * Vendor location entity representing a specific supplier yard/location
 */
export interface VendorLocation {
  id: number;
  name: string;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  vendorId: number;
  createdAt: Date;
  updatedAt: Date;
  /** Parent vendor */
  vendor?: Vendor;
  /** Products available at this location */
  vendorProducts?: VendorProduct[];
  /** Freight routes from this location */
  freightRoutes?: FreightRoute[];
}

/**
 * Vendor product entity representing a specific material from a vendor
 */
export interface VendorProduct {
  id: number;
  name: string;
  price: number; // Decimal type from database
  unit: string;
  notes: string | null;
  isActive: boolean;
  vendorId: number;
  vendorLocationId: number;
  createdAt: Date;
  updatedAt: Date;
  /** Parent vendor */
  vendor?: Vendor;
  /** Location where this product is available */
  vendorLocation?: VendorLocation;
}

/**
 * Freight route entity representing delivery routes from vendor locations
 */
export interface FreightRoute {
  id: number;
  destination: string;
  freightCostPerTon: number; // Decimal type from database
  notes: string | null;
  isActive: boolean;
  vendorLocationId: number;
  createdAt: Date;
  updatedAt: Date;
  /** Source vendor location */
  vendorLocation?: VendorLocation;
}
