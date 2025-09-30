import { component$, useVisibleTask$, useSignal, $ } from '@builder.io/qwik';
import { routeLoader$, type DocumentHead, useNavigate } from '@builder.io/qwik-city';
import { PrismaClient } from '@prisma/client';
import { VendorTable } from '~/components/vendors/VendorTable';
import { routeAction$, zod$, z } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { NavLink } from '~/components/NavLink';

const STORAGE_KEY = 'vendors-show-inactive';

function saveToLocalStorage(value: boolean) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, String(value));
  }
}

function getFromLocalStorage(): boolean {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  }
  return false;
}

export const useGetVendors = routeLoader$(async (event) => {
  const prisma = new PrismaClient();
  const showInactive = event.url.searchParams.get('showInactive') === 'true';

  const vendors = await prisma.vendor.findMany({
    where: showInactive ? {} : { isActive: true },
    orderBy: { name: 'asc' },
  });

  const highlightedId = event.url.searchParams.get('highlight');
  return { vendors, highlightedId, showInactive };
});

export const useDeleteVendorAction = routeAction$(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async ({ id }, _requestEvent) => {
    try {
      const vendorId = Number(id);

      // Get all currently active children
      const [activeLocations, activeProducts] = await Promise.all([
        db.vendorLocation.findMany({
          where: { vendorId, isActive: true },
          select: { id: true },
        }),
        db.vendorProduct.findMany({
          where: { vendorId, isActive: true },
          select: { id: true },
        }),
      ]);

      const locationIds = activeLocations.map((l) => l.id);

      // Get active freight routes for these locations
      const activeRoutes = await db.freightRoute.findMany({
        where: { vendorLocationId: { in: locationIds }, isActive: true },
        select: { id: true },
      });

      // Cascade deactivate: mark vendor and all currently active children as inactive
      await Promise.all([
        // Deactivate vendor
        db.vendor.update({
          where: { id: vendorId },
          data: { isActive: false },
        }),
        // Deactivate active locations and mark as deactivatedByParent
        db.vendorLocation.updateMany({
          where: { id: { in: locationIds } },
          data: { isActive: false, deactivatedByParent: true },
        }),
        // Deactivate active products and mark as deactivatedByParent
        db.vendorProduct.updateMany({
          where: { id: { in: activeProducts.map((p) => p.id) } },
          data: { isActive: false, deactivatedByParent: true },
        }),
        // Deactivate active freight routes and mark as deactivatedByParent
        db.freightRoute.updateMany({
          where: { id: { in: activeRoutes.map((r) => r.id) } },
          data: { isActive: false, deactivatedByParent: true },
        }),
      ]);

      return { success: true };
    } catch (error) {
      console.error('Deactivate failed:', error);
      return { success: false, error: 'Failed to deactivate vendor' };
    }
  },
  zod$({
    id: z.string(),
  }),
);

export const useReactivateVendorAction = routeAction$(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async ({ id }, _requestEvent) => {
    try {
      const vendorId = Number(id);

      // Get all children that were deactivated by parent
      const [parentDeactivatedLocations, parentDeactivatedProducts] = await Promise.all([
        db.vendorLocation.findMany({
          where: { vendorId, deactivatedByParent: true },
          select: { id: true },
        }),
        db.vendorProduct.findMany({
          where: { vendorId, deactivatedByParent: true },
          select: { id: true },
        }),
      ]);

      const locationIds = parentDeactivatedLocations.map((l) => l.id);

      // Get freight routes that were deactivated by parent
      const parentDeactivatedRoutes = await db.freightRoute.findMany({
        where: { vendorLocationId: { in: locationIds }, deactivatedByParent: true },
        select: { id: true },
      });

      // Reactivate vendor and restore children that were auto-deactivated
      await Promise.all([
        // Reactivate vendor
        db.vendor.update({
          where: { id: vendorId },
          data: { isActive: true },
        }),
        // Reactivate locations that were deactivatedByParent
        db.vendorLocation.updateMany({
          where: { id: { in: locationIds } },
          data: { isActive: true, deactivatedByParent: false },
        }),
        // Reactivate products that were deactivatedByParent
        db.vendorProduct.updateMany({
          where: { id: { in: parentDeactivatedProducts.map((p) => p.id) } },
          data: { isActive: true, deactivatedByParent: false },
        }),
        // Reactivate freight routes that were deactivatedByParent
        db.freightRoute.updateMany({
          where: { id: { in: parentDeactivatedRoutes.map((r) => r.id) } },
          data: { isActive: true, deactivatedByParent: false },
        }),
      ]);

      return { success: true };
    } catch (error) {
      console.error('Reactivate failed:', error);
      return { success: false, error: 'Failed to reactivate vendor' };
    }
  },
  zod$({
    id: z.string(),
  }),
);

export default component$(() => {
  const data = useGetVendors();
  const nav = useNavigate();
  const showInactive = useSignal(data.value.showInactive);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('highlight')) {
      url.searchParams.delete('highlight');
      history.replaceState(null, '', url.toString());
    }

    // Load from localStorage on mount and sync URL if needed
    const savedValue = getFromLocalStorage();
    const urlHasShowInactive = url.searchParams.get('showInactive') === 'true';

    // If localStorage says true but URL doesn't have it, navigate with the param
    if (savedValue && !urlHasShowInactive) {
      url.searchParams.set('showInactive', 'true');
      window.location.href = url.toString();
    }
  });

  const handleToggle = $(() => {
    const newValue = !showInactive.value;
    showInactive.value = newValue;
    saveToLocalStorage(newValue);

    const url = new URL(window.location.href);
    if (newValue) {
      url.searchParams.set('showInactive', 'true');
    } else {
      url.searchParams.delete('showInactive');
    }
    nav(url.pathname + '?' + url.searchParams.toString());
  });

  return (
    <section class="mt-8">
      <div class="mb-4 flex gap-4">
        <NavLink
          href="/vendors/create"
          class="btn btn-accent"
        >
          + New Vendor
        </NavLink>
      </div>

      <div class="mb-4 flex items-center gap-2">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            class="toggle toggle-primary"
            checked={showInactive.value}
            onChange$={handleToggle}
          />
          <span>Show Inactive Vendors</span>
        </label>
      </div>

      <VendorTable
        vendors={data.value.vendors}
        highlightId={data.value.highlightedId ?? undefined}
      />
    </section>
  );
});

export const head: DocumentHead = {
  title: 'CHLM25 | Vendors',
  meta: [
    {
      name: 'description',
      content: 'Manage vendor relationships, material suppliers, quarry locations, and product sourcing for landscape materials.',
    },
  ],
};
