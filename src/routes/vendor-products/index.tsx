import { component$, useVisibleTask$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { PrismaClient } from '@prisma/client';
import { NavLink } from '~/components/NavLink';
import PageTitle from '~/components/PageTitle';
import { VendorProductTable } from '~/components/vendor-products/VendorProductTable';
import { routeAction$, zod$, z } from '@builder.io/qwik-city';
import { db } from '~/lib/db';

export const useGetVendorProducts = routeLoader$(async (event) => {
  const prisma = new PrismaClient();
  const vendorProducts = await prisma.vendorProduct.findMany({
    include: {
      vendor: true,
      vendorLocation: true,
    },
  });
  const highlightedId = event.url.searchParams.get('highlight');
  return { vendorProducts, highlightedId };
});

export const useDeleteVendorProductAction = routeAction$(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async ({ id }, _requestEvent) => {
    try {
      await db.vendorProduct.delete({ where: { id: Number(id) } });
      return { success: true };
    } catch (error) {
      console.error('Delete failed:', error);
      return { success: false, error: 'Failed to delete vendor product' };
    }
  },
  zod$({
    id: z.string(),
  }),
);

export default component$(() => {
  const data = useGetVendorProducts();

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
      <PageTitle text="Vendor Products" />
      <p class="mb-4">List of all products available from vendor locations.</p>

      <div class="mb-6">
        <NavLink
          href="/vendor-products/create"
          class="font-semibold outline text-emerald-700 outline-emerald-700 rounded-3xl hover:bg-emerald-600 hover:outline-0 hover:text-white px-3 py-1.5 transition-colors duration-150 ease-in-out"
        >
          + New Vendor Product
        </NavLink>
      </div>

      <VendorProductTable
        vendorProducts={data.value.vendorProducts}
        highlightId={data.value.highlightedId ?? undefined}
      />
    </section>
  );
});
