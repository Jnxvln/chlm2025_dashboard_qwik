import { component$, useVisibleTask$, useSignal, $ } from '@builder.io/qwik';
import { routeLoader$, useNavigate } from '@builder.io/qwik-city';
import { PrismaClient } from '@prisma/client';
import { NavLink } from '~/components/NavLink';
import PageTitle from '~/components/PageTitle';
import { DriverTable } from '~/components/drivers/DriverTable';
import { routeAction$, zod$, z } from '@builder.io/qwik-city';
import { db } from '~/lib/db';

const STORAGE_KEY = 'drivers-show-inactive';

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

export const useGetDrivers = routeLoader$(async (event) => {
  const prisma = new PrismaClient();
  const showInactive = event.url.searchParams.get('showInactive') === 'true';

  const drivers = await prisma.driver.findMany({
    where: showInactive ? {} : { isActive: true },
    orderBy: { lastName: 'asc' },
  });

  const highlightedId = event.url.searchParams.get('highlight');
  return { drivers, highlightedId, showInactive };
});

export const useDeleteDriverAction = routeAction$(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async ({ id }, _requestEvent) => {
    try {
      await db.driver.update({
        where: { id: Number(id) },
        data: { isActive: false },
      });
      return { success: true };
    } catch (error) {
      console.error('Deactivate failed:', error);
      return { success: false, error: 'Failed to deactivate driver' };
    }
  },
  zod$({
    id: z.string(),
  }),
);

export const useReactivateDriverAction = routeAction$(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async ({ id }, _requestEvent) => {
    try {
      await db.driver.update({
        where: { id: Number(id) },
        data: { isActive: true },
      });
      return { success: true };
    } catch (error) {
      console.error('Reactivate failed:', error);
      return { success: false, error: 'Failed to reactivate driver' };
    }
  },
  zod$({
    id: z.string(),
  }),
);

export default component$(() => {
  const data = useGetDrivers();
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
    <section class="container mx-auto p-6">
      <PageTitle text="Drivers" />
      <p class="mb-4">List of active and historical drivers.</p>

      <div class="mb-6 flex gap-4">
        <NavLink
          href="/drivers/create"
          class="btn btn-accent"
        >
          + New Driver
        </NavLink>

        <NavLink
          href="/workdays"
          class="btn btn-accent"
        >
          Workdays
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
          <span>Show Inactive Drivers</span>
        </label>
      </div>

      <DriverTable
        drivers={data.value.drivers}
        highlightId={data.value.highlightedId ?? undefined}
      />
    </section>
  );
});
