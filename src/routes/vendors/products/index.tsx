import { component$, useVisibleTask$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { PrismaClient } from '@prisma/client';
import { NavLink } from '~/components/NavLink';
import { VendorProductTable } from '~/components/vendor-products/VendorProductTable';
import { routeAction$, zod$, z } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import PageSubtitle from '~/components/PageSubtitle';

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
    <div class="container mx-auto p-6">
      <div class="flex justify-between items-center mb-6">
        <PageSubtitle text="Vendor Products" />
        <NavLink
          href="/vendors/products/create"
          class="btn btn-primary"
        >
          + New Vendor Product
        </NavLink>
      </div>

      <div class="flex gap-4 mb-6">
        <NavLink
          href="/vendors"
          class="btn btn-ghost"
        >
          ← Vendors
        </NavLink>
      </div>

      <p class="mb-6" style="color: rgb(var(--color-text-secondary))">
        List of all products available from vendor locations.
      </p>

      <VendorProductTable
        vendorProducts={data.value.vendorProducts}
        highlightId={data.value.highlightedId ?? undefined}
      />
    </div>
  );
});
