import { component$, useVisibleTask$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { PrismaClient } from '@prisma/client';
import { NavLink } from '~/components/NavLink';
import { VendorLocationTable } from '~/components/vendor-locations/VendorLocationTable';
import { routeAction$, zod$, z } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import PageSubtitle from '~/components/PageSubtitle';

export const useGetVendorLocations = routeLoader$(async (event) => {
  const prisma = new PrismaClient();
  const vendorLocations = await prisma.vendorLocation.findMany({
    include: {
      vendor: true, // Include vendor info for display
    },
  });
  const highlightedId = event.url.searchParams.get('highlight');
  return { vendorLocations, highlightedId };
});

export const useDeleteVendorLocationAction = routeAction$(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async ({ id }, _requestEvent) => {
    try {
      await db.vendorLocation.delete({ where: { id: Number(id) } });
      return { success: true };
    } catch (error) {
      console.error('Delete failed:', error);
      return { success: false, error: 'Failed to delete vendor location' };
    }
  },
  zod$({
    id: z.string(),
  }),
);

export default component$(() => {
  const data = useGetVendorLocations();

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('highlight')) {
      url.searchParams.delete('highlight');
      history.replaceState(null, '', url.toString());
    }
  });

  return (
    <section>
      <PageSubtitle text="Vendor Locations" />
      <p class="mb-4">List of all vendor locations and quarries.</p>

      <div class="mb-8">
        <NavLink
          href="/vendors/locations/create"
          class="font-semibold outline text-emerald-700 outline-emerald-700 rounded-3xl hover:bg-emerald-600 hover:outline-0 hover:text-white px-3 py-1.5 transition-colors duration-150 ease-in-out"
        >
          + New Vendor Location
        </NavLink>
      </div>

      <VendorLocationTable
        vendorLocations={data.value.vendorLocations}
        highlightId={data.value.highlightedId ?? undefined}
      />
    </section>
  );
});
