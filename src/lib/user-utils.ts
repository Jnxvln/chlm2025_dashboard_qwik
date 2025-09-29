import { db } from './db';

/**
 * Gets or creates a default system user for operations that require a createdById.
 * This ensures we always have a valid user ID for foreign key constraints.
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
    console.log('Created default system user:', user.id);
  }

  return user;
}