// src/routes/hauls/loader.ts
import { routeLoader$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
// import { z } from 'zod';

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

  let workdays: any[] = [];

  if (filters.driverId && filters.startDate && filters.endDate) {
    // Load workdays with nested hauls
    workdays = await db.workday.findMany({
      where: {
        driverId: filters.driverId,
        date: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      },
      include: {
        driver: true,
        hauls: {
          include: {
            vendorProduct: {
              include: { 
                vendor: true,
                vendorLocation: true,
              },
            },
            freightRoute: {
              include: { vendorLocation: true },
            },
          },
          orderBy: [{ dateHaul: 'asc' }],
        },
        _count: {
          select: { hauls: true },
        },
      },
      orderBy: [{ date: 'desc' }],
    });
  }

  return {
    drivers,
    workdays,
    currentDriverId: filters.driverId,
    currentStartDate: startDateStr || '',
    currentEndDate: endDateStr || '',
  };
});
