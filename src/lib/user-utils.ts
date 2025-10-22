/**
 * User utility functions for managing system users
 * @module lib/user-utils
 */

import { db } from './db';

/**
 * Gets or creates a default system user for operations that require a createdById.
 *
 * This ensures we always have a valid user ID for foreign key constraints when
 * creating records that require a user reference (hauls, workdays, etc.).
 *
 * The system user has:
 * - Email: system@chlandscapematerials.com
 * - Name: System User
 *
 * @returns Promise resolving to the system User entity
 *
 * @example
 * ```typescript
 * const user = await getOrCreateSystemUser();
 * await db.workday.create({
 *   data: {
 *     ...workdayData,
 *     createdById: user.id,
 *   },
 * });
 * ```
 */
export async function getOrCreateSystemUser() {
  let user = await db.user.findFirst();

  if (!user) {
    // Create a default system user if none exists
    user = await db.user.create({
      data: {
        email: 'system@chlandscapematerials.com',
        name: 'System User',
      },
    });
  }

  return user;
}