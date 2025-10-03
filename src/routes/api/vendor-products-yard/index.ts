import type { RequestHandler } from '@builder.io/qwik-city';
import { db } from '~/lib/db';

export const onGet: RequestHandler = async ({ json }) => {
  try {
    // Fetch all active vendor products that have a yard route
    const vendorProducts = await db.vendorProduct.findMany({
      where: {
        isActive: true,
        vendorLocation: {
          isActive: true,
          freightRoutes: {
            some: {
              toYard: true,
              isActive: true,
            },
          },
        },
      },
      include: {
        vendor: true,
        vendorLocation: {
          include: {
            freightRoutes: {
              where: {
                toYard: true,
                isActive: true,
              },
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

    // Transform the data to include the yard route directly
    const productsWithYardRoute = vendorProducts.map((product) => ({
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
      // Get the first yard route (there should typically only be one per location)
      freightRoute: product.vendorLocation.freightRoutes[0] || null,
    }));

    json(200, {
      success: true,
      products: productsWithYardRoute,
    });
  } catch (error) {
    console.error('❌ Error fetching vendor products with yard routes:', error);
    json(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
