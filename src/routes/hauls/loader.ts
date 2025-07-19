// src/routes/hauls/loader.ts
import { routeLoader$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { z } from 'zod';

export const useHaulsLoader = routeLoader$(async (event) => {
  const { url } = event;

  // Parse query params
  const driverId = parseInt(url.searchParams.get('driver') || '', 10);
  const startDateStr = url.searchParams.get('startDate');
  const endDateStr = url.searchParams.get('endDate');

  const isValidDate = (d?: string | null) => !!d && !isNaN(Date.parse(d));

  const filters = {
    driverId: !isNaN(driverId) ? driverId : undefined,
    startDate: isValidDate(startDateStr) ? new Date(startDateStr!) : undefined,
    endDate: isValidDate(endDateStr) ? new Date(endDateStr!) : undefined,
  };

  // Load all active drivers (for dropdown)
  const drivers = await db.driver.findMany({
    where: { isActive: true },
    orderBy: [{ lastName: 'asc' }],
  });

  let hauls = [];
  let workdaysByDate: Record<string, number> = {};

  if (filters.driverId && filters.startDate && filters.endDate) {
    const workdays = await db.workday.findMany({
      where: {
        driverId: filters.driverId,
        date: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      },
      select: {
        id: true,
        date: true,
      },
    });

    // Workdays by YYYY-MM-DD
    workdaysByDate = Object.fromEntries(
      workdays.map((w) => [w.date.toISOString().split('T')[0], w.id]),
    );

    // Load hauls joined with their workdays + nested vendor/freight route info
    hauls = await db.haul.findMany({
      where: {
        workday: {
          driverId: filters.driverId,
          date: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        },
      },
      include: {
        workday: {
          select: { id: true, date: true },
        },
        vendorProduct: {
          include: { vendor: true },
        },
        freightRoute: {
          include: { vendorLocation: true },
        },
      },
      orderBy: [{ dateHaul: 'asc' }],
    });
  }

  return {
    drivers,
    hauls,
    workdaysByDate,
    currentDriverId: filters.driverId,
    currentStartDate: startDateStr || '',
    currentEndDate: endDateStr || '',
  };
});
