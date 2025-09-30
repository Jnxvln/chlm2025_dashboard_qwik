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
      const locationId = Number(id);

      // Get all currently active children
      const [activeProducts, activeRoutes] = await Promise.all([
        db.vendorProduct.findMany({
          where: { vendorLocationId: locationId, isActive: true },
          select: { id: true },
        }),
        db.freightRoute.findMany({
          where: { vendorLocationId: locationId, isActive: true },
          select: { id: true },
        }),
      ]);

      // Cascade deactivate: mark location and all currently active children as inactive
      await Promise.all([
        // Deactivate location
        db.vendorLocation.update({
          where: { id: locationId },
          data: { isActive: false },
        }),
        // Deactivate active products and mark as deactivatedByParent
        db.vendorProduct.updateMany({
          where: { id: { in: activeProducts.map((p) => p.id) } },
          data: { isActive: false, deactivatedByParent: true },
        }),
        // Deactivate active routes and mark as deactivatedByParent
        db.freightRoute.updateMany({
          where: { id: { in: activeRoutes.map((r) => r.id) } },
          data: { isActive: false, deactivatedByParent: true },
        }),
      ]);

      return { success: true };
    } catch (error) {
      console.error('Deactivate failed:', error);
      return { success: false, error: 'Failed to deactivate vendor location' };
    }
  },
  zod$({
    id: z.string(),
  }),
);

export const useReactivateVendorLocationAction = routeAction$(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async ({ id }, _requestEvent) => {
    try {
      const locationId = Number(id);

      // Get all children that were deactivated by parent
      const [parentDeactivatedProducts, parentDeactivatedRoutes] = await Promise.all([
        db.vendorProduct.findMany({
          where: { vendorLocationId: locationId, deactivatedByParent: true },
          select: { id: true },
        }),
        db.freightRoute.findMany({
          where: { vendorLocationId: locationId, deactivatedByParent: true },
          select: { id: true },
        }),
      ]);

      // Reactivate location and restore children that were auto-deactivated
      await Promise.all([
        // Reactivate location
        db.vendorLocation.update({
          where: { id: locationId },
          data: { isActive: true, deactivatedByParent: false },
        }),
        // Reactivate products that were deactivatedByParent
        db.vendorProduct.updateMany({
          where: { id: { in: parentDeactivatedProducts.map((p) => p.id) } },
          data: { isActive: true, deactivatedByParent: false },
        }),
        // Reactivate routes that were deactivatedByParent
        db.freightRoute.updateMany({
          where: { id: { in: parentDeactivatedRoutes.map((r) => r.id) } },
          data: { isActive: true, deactivatedByParent: false },
        }),
      ]);

      return { success: true };
    } catch (error) {
      console.error('Reactivate failed:', error);
      return { success: false, error: 'Failed to reactivate vendor location' };
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
    <div class="container mx-auto p-6">
      <div class="flex justify-between items-center mb-6">
        <PageSubtitle text="Vendor Locations" />
        <NavLink
          href="/vendors/locations/create"
          class="btn btn-primary"
        >
          + New Vendor Location
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
        List of all vendor locations and quarries.
      </p>

      <VendorLocationTable
        vendorLocations={data.value.vendorLocations}
        highlightId={data.value.highlightedId ?? undefined}
      />
    </div>
  );
});
