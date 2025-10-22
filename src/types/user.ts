/**
 * Type definitions for user entities
 */

/**
 * User entity representing system users
 */
export interface User {
  id: number;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
  /** Hauls created by this user */
  haulsCreated?: any[]; // Haul type from haul.ts
  /** Workdays created by this user */
  workdaysCreated?: any[]; // Workday type from workday.ts
}
