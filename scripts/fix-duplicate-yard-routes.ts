import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDuplicateYardRoutes() {
  console.log('🔍 Finding duplicate yard routes...');

  // Find all freight routes where toYard is true
  const yardRoutes = await prisma.freightRoute.findMany({
    where: { toYard: true },
    orderBy: [
      { vendorLocationId: 'asc' },
      { id: 'asc' }, // Keep the first one created
    ],
  });

  // Group by vendorLocationId
  const routesByLocation = new Map<number, typeof yardRoutes>();
  yardRoutes.forEach((route) => {
    const existing = routesByLocation.get(route.vendorLocationId) || [];
    existing.push(route);
    routesByLocation.set(route.vendorLocationId, existing);
  });

  // Find duplicates
  const duplicates: Array<{ locationId: number; routes: typeof yardRoutes }> = [];
  routesByLocation.forEach((routes, locationId) => {
    if (routes.length > 1) {
      duplicates.push({ locationId, routes });
    }
  });

  if (duplicates.length === 0) {
    console.log('✅ No duplicate yard routes found!');
    return;
  }

  console.log(`⚠️  Found ${duplicates.length} location(s) with duplicate yard routes:`);

  for (const { locationId, routes } of duplicates) {
    const location = await prisma.vendorLocation.findUnique({
      where: { id: locationId },
      include: { vendor: true },
    });

    console.log(`\n📍 Location: ${location?.vendor.name} - ${location?.name} (ID: ${locationId})`);
    console.log(`   Has ${routes.length} yard routes:`);

    routes.forEach((route, index) => {
      console.log(`   ${index === 0 ? '✓ KEEP' : '✗ REMOVE'}: Route #${route.id} - "${route.destination}" (Created: ${route.createdAt.toISOString()})`);
    });

    // Keep the first route (oldest), set others to toYard = false
    const routesToUpdate = routes.slice(1);

    for (const route of routesToUpdate) {
      await prisma.freightRoute.update({
        where: { id: route.id },
        data: { toYard: false },
      });
      console.log(`   ✅ Updated route #${route.id} - set toYard = false`);
    }
  }

  console.log('\n✅ All duplicate yard routes have been fixed!');
  console.log('You can now run: npx prisma migrate deploy');
}

fixDuplicateYardRoutes()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
