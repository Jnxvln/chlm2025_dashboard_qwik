import { component$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, zod$, z } from '@builder.io/qwik-city';
import PageSubtitle from '~/components/PageSubtitle';
import { NavLink } from '~/components/NavLink';
import { FreightRoutesTable } from '~/components/vendors/routes/FreightRoutesTable';
import { db } from '~/lib/db';

export const useFreightRoutesLoader = routeLoader$(async (event) => {
  const highlightId = event.url.searchParams.get('highlight');

  const routes = await db.freightRoute.findMany({
    orderBy: { destination: 'asc' },
    include: {
      vendorLocation: {
        include: {
          vendor: true,
        },
      },
    },
  });

  return {
    routes,
    highlightId,
  };
});

export const useDeactivateFreightRouteAction = routeAction$(
  async ({ id }) => {
    try {
      await db.freightRoute.update({
        where: { id: Number(id) },
        data: { isActive: false },
      });
      return { success: true };
    } catch (error) {
      console.error('Deactivate failed:', error);
      return { success: false, error: 'Failed to deactivate freight route' };
    }
  },
  zod$({
    id: z.string(),
  }),
);

export const useReactivateFreightRouteAction = routeAction$(
  async ({ id }) => {
    try {
      await db.freightRoute.update({
        where: { id: Number(id) },
        data: { isActive: true, deactivatedByParent: false },
      });
      return { success: true };
    } catch (error) {
      console.error('Reactivate failed:', error);
      return { success: false, error: 'Failed to reactivate freight route' };
    }
  },
  zod$({
    id: z.string(),
  }),
);

export default component$(() => {
  const routesData = useFreightRoutesLoader();

  return (
    <section>
      <PageSubtitle text="Freight Routes" />
      <p class="mb-4">List of all freight routes.</p>

      <div class="mb-6">
        <NavLink
          href="/vendors/routes/new"
          class="font-semibold outline text-emerald-700 outline-emerald-700 rounded-3xl hover:bg-emerald-600 hover:outline-0 hover:text-white px-3 py-1.5 transition-colors duration-150 ease-in-out"
        >
          + New Freight Route
        </NavLink>
      </div>

      <FreightRoutesTable
        routes={routesData.value.routes}
        highlightId={routesData.value.highlightId ?? undefined}
      />
    </section>
  );
});
