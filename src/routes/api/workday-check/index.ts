// src/routes/api/workday-check/index.ts
import type { RequestHandler } from '@builder.io/qwik-city';
import { db } from '~/lib/db';

export const onGet: RequestHandler = async ({ url, json }) => {
  const driverId = parseInt(url.searchParams.get('driverId') || '', 10);
  const date = url.searchParams.get('date');

  if (!driverId || isNaN(driverId) || !date) {
    throw json(400, { error: 'Missing driverId or date' });
  }

  try {
    const workday = await db.workday.findUnique({
      where: {
        driverId_date: {
          driverId,
          date: new Date(date + 'T12:00:00Z'), // Use UTC to match workday creation
        },
      },
      select: {
        id: true,
        chHours: true,
        ncHours: true,
        date: true
      },
    });

    const driver = await db.driver.findUnique({
      where: { id: driverId },
      select: { firstName: true, lastName: true }
    });

    console.log('WORKDAY CHECK API:', {
      driverId,
      dateInput: date,
      dateUsedForLookup: new Date(date + 'T12:00:00Z').toISOString(),
      workdayExists: !!workday,
      workdayId: workday?.id,
      foundWorkdayDate: workday?.date?.toISOString()
    });

    json(200, {
      exists: !!workday,
      workday: workday || null,
      driver: driver || null
    });
  } catch (error) {
    console.error('Workday check failed:', error);
    throw json(500, { error: 'Database error' });
  }
};