/**
 * Type definitions for driver and workday entities
 */

import type { Workday } from './workday';

/**
 * Driver entity representing a delivery truck driver
 */
export interface Driver {
  id: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  dateHired: Date | null;
  endDumpPayRate: number; // Decimal type from database
  flatBedPayRate: number; // Decimal type from database
  nonCommissionRate: number; // Decimal type from database
  defaultTruck: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  /** Driver's workdays */
  workdays?: Workday[];
  /** Driver's hauls */
  hauls?: any[]; // Haul type would be defined in haul.ts
}

/**
 * Full name computed from firstName and lastName
 */
export type DriverFullName = `${string} ${string}`;
