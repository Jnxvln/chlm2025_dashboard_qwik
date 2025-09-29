// src/routes/api/create-workday/index.ts
import type { RequestHandler } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { getOrCreateSystemUser } from '~/lib/user-utils';

export const onPost: RequestHandler = async ({ parseBody, json }) => {
  const body = await parseBody();
  const { driverId, date } = body as { driverId: string; date: string };

  if (!driverId || !date) {
    throw json(400, { error: 'Missing driverId or date' });
  }

  try {
    // Get or create a default user for workday creation
    const user = await getOrCreateSystemUser();

    const workday = await db.workday.create({
      data: {
        date: new Date(date + 'T12:00:00Z'), // Use UTC to avoid timezone issues
        chHours: 0,
        ncHours: 0,
        driverId: parseInt(driverId, 10),
        createdById: user.id,
      },
      select: {
        id: true,
        date: true,
        chHours: true,
        ncHours: true
      },
    });

    console.log('WORKDAY CREATE API - Created workday:', {
      workdayId: workday.id,
      driverId,
      date
    });

    json(200, {
      success: true,
      workday
    });
  } catch (error) {
    console.error('Workday creation failed:', error);
    throw json(500, { error: 'Failed to create workday' });
  }
};