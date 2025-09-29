// src/routes/hauls/new/loader.ts
import { routeLoader$ } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { getOrCreateSystemUser } from '~/lib/user-utils';

export const useNewHaulLoader = routeLoader$(async (event) => {
  const url = event.url;
  const driverId = parseInt(url.searchParams.get('driver') || '', 10);
  const duplicateId = parseInt(url.searchParams.get('duplicateId') || '', 10);
  const preselectedDate = url.searchParams.get('date'); // date from workday-specific links

  console.log('NEW HAUL LOADER - Starting:', {
    driverId: driverId || 'none',
    duplicateId: duplicateId || 'none',
    preselectedDate: preselectedDate || 'none',
    hasDriver: !!driverId && !isNaN(driverId)
  });

  // Fetch all drivers
  const drivers = await db.driver.findMany({
    where: { isActive: true },
    orderBy: [{ lastName: 'asc' }],
  });

  // Match with specific driver (if provided)
  const driver = driverId && !isNaN(driverId) ? drivers.find((d) => d.id === driverId) : null;

  // Redirect if specific driver requested but not found
  if (driverId && !isNaN(driverId) && !driver) {
    throw event.redirect(302, '/hauls');
  }

  const user = await getOrCreateSystemUser(); // Get or create system user

  // Load form data
  const [vendors, vendorProducts, freightRoutes, duplicateHaul] = await Promise.all([
    db.vendor.findMany({
      where: { isActive: true },
      include: {
        vendorLocations: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    }),

    db.vendorProduct.findMany({
      where: { isActive: true },
      include: {
        vendor: true,
        vendorLocation: true,
      },
      orderBy: [{ name: 'asc' }],
    }),

    db.freightRoute.findMany({
      where: { isActive: true },
      include: { vendorLocation: true },
      orderBy: [{ destination: 'asc' }],
    }),

    // Optionally load haul to duplicate
    duplicateId && !isNaN(duplicateId)
      ? db.haul.findUnique({
          where: { id: duplicateId },
          include: {
            vendorProduct: true,
            freightRoute: true,
          }
        })
      : null
  ]);

  console.log('NEW HAUL LOADER - Data loaded:', {
    vendorCount: vendors.length,
    productCount: vendorProducts.length,
    routeCount: freightRoutes.length,
    duplicateHaul: duplicateHaul ? duplicateHaul.id : 'none'
  });

  return {
    // No workday handling at load time - user will pick date first (unless preselected)
    createdById: user.id,
    vendors,
    vendorProducts,
    freightRoutes,
    haulDate: preselectedDate || '', // Use preselected date if available
    driverId: driverId && !isNaN(driverId) ? driverId : null,
    drivers,
    driver,
    duplicateHaul,
    hasPreselectedDate: !!preselectedDate,
  };
});