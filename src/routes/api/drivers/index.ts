import type { RequestHandler } from '@builder.io/qwik-city';
import { db } from '~/lib/db';

export const onGet: RequestHandler = async ({ json }) => {
  try {
    // Fetch all active drivers
    const drivers = await db.driver.findMany({
      where: { isActive: true },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ],
    });

    json(200, {
      success: true,
      drivers,
    });
  } catch (error) {
    console.error('❌ Error fetching drivers:', error);
    json(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};