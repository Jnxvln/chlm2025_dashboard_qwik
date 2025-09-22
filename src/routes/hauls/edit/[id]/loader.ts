// src/routes/hauls/edit/[id]/loader.ts
import { routeLoader$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';

export const useEditHaulLoader = routeLoader$(async (event) => {
  const haulId = parseInt(event.params.id, 10);

  if (isNaN(haulId)) {
    throw event.redirect(302, '/hauls');
  }

  // Load the haul with all related data
  const haul = await db.haul.findUnique({
    where: { id: haulId },
    include: {
      workday: {
        include: {
          driver: true,
        },
      },
      vendorProduct: {
        include: {
          vendor: true,
          vendorLocation: true,
        },
      },
      freightRoute: {
        include: {
          vendorLocation: true,
        },
      },
    },
  });

  if (!haul) {
    throw event.redirect(302, '/hauls');
  }

  // Fetch all drivers
  const drivers = await db.driver.findMany({
    where: { isActive: true },
    orderBy: [{ lastName: 'asc' }],
  });

  // Fetch all vendors with locations
  const vendors = await db.vendor.findMany({
    where: { isActive: true },
    include: {
      vendorLocations: {
        where: { isActive: true },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  // Fetch all vendor products
  const vendorProducts = await db.vendorProduct.findMany({
    where: { isActive: true },
    include: {
      vendor: true,
      vendorLocation: true,
    },
    orderBy: [{ name: 'asc' }],
  });

  // Fetch all freight routes
  const freightRoutes = await db.freightRoute.findMany({
    where: { isActive: true },
    include: { vendorLocation: true },
    orderBy: [{ destination: 'asc' }],
  });

  return {
    haul,
    drivers,
    vendors,
    vendorProducts,
    freightRoutes,
  };
});