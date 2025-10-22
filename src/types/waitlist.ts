/**
 * Type definitions for waitlist entities
 */

/**
 * Waitlist entry status options
 */
export type WaitlistStatus = 'waiting' | 'notified' | 'completed' | 'cancelled';

/**
 * Waitlist entry entity for tracking customer requests
 */
export interface WaitlistEntry {
  id: number;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  materialRequested: string;
  quantityRequested: string | null;
  notes: string | null;
  status: WaitlistStatus;
  notifiedDate: Date | null;
  completedDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
