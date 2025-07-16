import { component$, useVisibleTask$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { PrismaClient } from '@prisma/client';
import { NavLink } from '~/components/NavLink';
import PageTitle from '~/components/PageTitle';
import { DriverTable } from '~/components/drivers/DriverTable';
import { routeAction$, zod$, z } from '@builder.io/qwik-city';
import { db } from '~/lib/db';

export const useGetDrivers = routeLoader$(async (event) => {
  const prisma = new PrismaClient();
  const drivers = await prisma.driver.findMany();
  const highlightedId = event.url.searchParams.get('highlight');
  return { drivers, highlightedId };
});

export const useDeleteDriverAction = routeAction$(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async ({ id }, _requestEvent) => {
    try {
      await db.driver.delete({ where: { id: Number(id) } });
      return { success: true };
    } catch (error) {
      console.error('Delete failed:', error);
      return { success: false, error: 'Failed to delete driver' };
    }
  },
  zod$({
    id: z.string(),
  }),
);

export default component$(() => {
  const data = useGetDrivers();

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('highlight')) {
      url.searchParams.delete('highlight');
      history.replaceState(null, '', url.toString());
    }
  });

  return (
    <section class="container mx-auto p-6">
      <PageTitle text="Drivers" />
      <p class="mb-4">List of active and historical drivers.</p>

      <div class="mb-6 flex gap-4">
        <NavLink
          href="/drivers/create"
          class="font-semibold outline text-emerald-700 outline-emerald-700 rounded-3xl hover:bg-emerald-600 hover:outline-0 hover:text-white px-3 py-1.5 transition-colors duration-150 ease-in-out"
        >
          + New Driver
        </NavLink>

        <NavLink
          href="/workdays"
          class="font-semibold outline text-emerald-700 outline-emerald-700 rounded-3xl hover:bg-emerald-600 hover:outline-0 hover:text-white px-3 py-1.5 transition-colors duration-150 ease-in-out"
        >
          Workdays
        </NavLink>
      </div>

      <DriverTable
        drivers={data.value.drivers}
        highlightId={data.value.highlightedId ?? undefined}
      />
    </section>
  );
});
