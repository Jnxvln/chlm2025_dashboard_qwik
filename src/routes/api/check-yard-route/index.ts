import type { RequestHandler } from '@builder.io/qwik-city';
import { db } from '~/lib/db';

export const onGet: RequestHandler = async ({ query, json }) => {
  const locationId = query.get('locationId');
  const excludeRouteId = query.get('excludeRouteId'); // For edit form

  if (!locationId) {
    json(400, { error: 'locationId is required' });
    return;
  }

  const existingYardRoute = await db.freightRoute.findFirst({
    where: {
      vendorLocationId: parseInt(locationId),
      toYard: true,
      ...(excludeRouteId ? { id: { not: parseInt(excludeRouteId) } } : {}),
    },
    select: {
      id: true,
      destination: true,
      vendorLocation: {
        select: {
          name: true,
          vendor: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  json(200, {
    exists: !!existingYardRoute,
    route: existingYardRoute,
  });
};
