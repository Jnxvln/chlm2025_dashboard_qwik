// src/routes/hauls/new/loader.ts
import { routeLoader$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';

export const useNewHaulLoader = routeLoader$(async (event) => {
  const url = event.url;
  const driverId = parseInt(url.searchParams.get('driver') || '', 10);
  const rawDate =
    url.searchParams.get('startDate') || new Date().toISOString().split('T')[0]; // fallback to today

  // Fetch all drivers
  const drivers = await db.driver.findMany({
    where: { isActive: true },
    orderBy: [{ lastName: 'asc' }],
  });

  // Match with specific driver (if provided)
  const driver = drivers.find((d) => d.id === driverId);
  if (!driver) {
    throw event.redirect(302, '/hauls');
  }

  console.log('loader running:', {
    driverId,
    rawDate,
  });

  if (!driverId || !rawDate) {
    throw event.redirect(302, '/hauls');
  }

  const parsedDate = new Date(rawDate);
  const dateStr = parsedDate.toISOString().split('T')[0];

  const user = await db.user.findFirst(); // Simplified auth for now

  const workday = await db.workday.upsert({
    where: {
      driverId_date: {
        driverId,
        date: new Date(dateStr),
      },
    },
    update: {}, // no-op if exists
    create: {
      date: new Date(dateStr),
      chHours: 0,
      ncHours: 0,
      driverId,
      createdById: user?.id || 1,
    },
    select: { id: true },
  });

  const vendorProducts = await db.vendorProduct.findMany({
    where: { isActive: true },
    include: { vendor: true },
    orderBy: [{ name: 'asc' }],
  });

  const freightRoutes = await db.freightRoute.findMany({
    where: { isActive: true },
    include: { vendorLocation: true },
    orderBy: [{ destination: 'asc' }],
  });

  return {
    workdayId: workday.id,
    createdById: user?.id || 1,
    vendorProducts,
    freightRoutes,
    haulDate: dateStr,
    driverId,
    drivers,
    driver,
  };
});
