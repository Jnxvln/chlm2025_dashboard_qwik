/**
 * Type definitions for material and material category entities
 */

/**
 * Material entity representing inventory items
 */
export interface Material {
  id: number;
  name: string;
  stock: string;
  image: string | null;
  bin: string | null;
  size: string | null;
  description: string | null;
  notes: string | null;
  isFeatured: boolean;
  isTruckable: boolean;
  categoryId: number;
  createdAt: Date;
  updatedAt: Date;
  /** Material category */
  category?: MaterialCategory;
}

/**
 * Material category entity for organizing materials
 */
export interface MaterialCategory {
  id: number;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  /** Materials in this category */
  materials?: Material[];
}
