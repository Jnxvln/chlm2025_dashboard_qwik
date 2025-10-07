import type { RequestHandler } from '@builder.io/qwik-city';
import { db } from '~/lib/db';

export const onGet: RequestHandler = async ({ json }) => {
  try {
    // Fetch all active vendor products with all their freight routes
    const vendorProducts = await db.vendorProduct.findMany({
      where: {
        isActive: true,
        vendorLocation: {
          isActive: true,
        },
      },
      include: {
        vendor: true,
        vendorLocation: {
          include: {
            freightRoutes: {
              where: {
                isActive: true,
              },
              orderBy: [
                { toYard: 'desc' }, // C&H Yard routes first
                { destination: 'asc' },
              ],
            },
          },
        },
      },
      orderBy: [
        { vendor: { name: 'asc' } },
        { vendorLocation: { name: 'asc' } },
        { name: 'asc' },
      ],
    });

    // Transform the data to include all freight routes
    const productsWithRoutes = vendorProducts.map((product) => ({
      id: product.id,
      name: product.name,
      productCost: product.productCost,
      notes: product.notes,
      vendorId: product.vendorId,
      vendorName: product.vendor.name,
      vendorShortName: product.vendor.shortName,
      chtFuelSurcharge: product.vendor.chtFuelSurcharge,
      vendorLocationId: product.vendorLocationId,
      vendorLocationName: product.vendorLocation.name,
      freightRoutes: product.vendorLocation.freightRoutes,
    }));

    json(200, {
      success: true,
      products: productsWithRoutes,
    });
  } catch (error) {
    console.error('❌ Error fetching vendor products:', error);
    json(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
