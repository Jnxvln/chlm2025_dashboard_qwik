// src/routes/api/create-workday/index.ts
import type { RequestHandler } from '@builder.io/qwik-city';
import { db } from '~/lib/db';

export const onPost: RequestHandler = async ({ parseBody, json }) => {
  const body = await parseBody();
  const { driverId, date } = body;

  if (!driverId || !date) {
    throw json(400, { error: 'Missing driverId or date' });
  }

  try {
    const user = await db.user.findFirst(); // Simplified auth

    const workday = await db.workday.create({
      data: {
        date: new Date(date),
        chHours: 0,
        ncHours: 0,
        driverId: parseInt(driverId, 10),
        createdById: user?.id || 1,
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