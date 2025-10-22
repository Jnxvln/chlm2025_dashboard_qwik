/**
 * Type definitions for contact entities
 */

/**
 * Contact entity representing customer or business contacts
 */
export interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
