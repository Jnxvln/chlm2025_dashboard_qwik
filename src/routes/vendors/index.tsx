import { component$, useVisibleTask$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { PrismaClient } from '@prisma/client';
import { VendorTable } from '~/components/vendors/VendorTable';
import { routeAction$, zod$, z } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { NavLink } from '~/components/NavLink';

export const useGetVendors = routeLoader$(async (event) => {
  const prisma = new PrismaClient();
  const vendors = await prisma.vendor.findMany();
  const highlightedId = event.url.searchParams.get('highlight');
  return { vendors, highlightedId };
});

export const useDeleteVendorAction = routeAction$(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async ({ id }, _requestEvent) => {
    try {
      await db.vendor.delete({ where: { id: Number(id) } });
      return { success: true };
    } catch (error) {
      console.error('Delete failed:', error);
      return { success: false, error: 'Failed to delete vendor' };
    }
  },
  zod$({
    id: z.string(),
  }),
);

export default component$(() => {
  const data = useGetVendors();

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('highlight')) {
      url.searchParams.delete('highlight');
      history.replaceState(null, '', url.toString());
    }
  });

  return (
    <section class="mt-8">
      <div class="mb-4">
        <NavLink
          href="/vendors/create"
          class="font-semibold outline text-emerald-700 outline-emerald-700 rounded-3xl hover:bg-emerald-600 hover:outline-0 hover:text-white px-3 py-1.5 transition-colors duration-150 ease-in-out"
        >
          + New Vendor
        </NavLink>
      </div>

      <VendorTable
        vendors={data.value.vendors}
        highlightId={data.value.highlightedId ?? undefined}
      />
    </section>
  );
});
