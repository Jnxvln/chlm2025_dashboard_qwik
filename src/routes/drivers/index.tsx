import { component$, useVisibleTask$, useSignal, $, useComputed$ } from '@builder.io/qwik';
import { routeLoader$, useNavigate } from '@builder.io/qwik-city';
import { PrismaClient } from '@prisma/client';
import { NavLink } from '~/components/NavLink';
import PageTitle from '~/components/PageTitle';
import { DriverTable } from '~/components/drivers/DriverTable';
import { routeAction$, zod$, z } from '@builder.io/qwik-city';
import { db } from '~/lib/db';

const SHOW_INACTIVE_STORAGE_KEY = 'drivers-show-inactive';
const SETTINGS_STORAGE_KEY = 'drivers-settings';

type SortField = 'defaultTruck' | 'firstName' | 'lastName' | 'dateHired';
type SortOrder = 'asc' | 'desc';

interface DriversSettings {
  search: string;
  sortBy: SortField;
  sortOrder: SortOrder;
}

function saveShowInactiveToLocalStorage(value: boolean) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SHOW_INACTIVE_STORAGE_KEY, String(value));
  }
}

function getShowInactiveFromLocalStorage(): boolean {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(SHOW_INACTIVE_STORAGE_KEY) === 'true';
  }
  return false;
}

function saveSettingsToLocalStorage(settings: DriversSettings) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }
}

function getSettingsFromLocalStorage(): DriversSettings {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // If parsing fails, return defaults
      }
    }
  }
  return {
    search: '',
    sortBy: 'defaultTruck',
    sortOrder: 'asc',
  };
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

  // Search and sort state
  const searchQuery = useSignal('');
  const sortBy = useSignal<SortField>('defaultTruck');
  const sortOrder = useSignal<SortOrder>('asc');

  // Computed filtered and sorted drivers
  const filteredDrivers = useComputed$(() => {
    let drivers = [...data.value.drivers];

    // Filter by search query
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase();
      drivers = drivers.filter((driver) => {
        const firstName = driver.firstName?.toLowerCase() || '';
        const lastName = driver.lastName?.toLowerCase() || '';
        const defaultTruck = driver.defaultTruck?.toLowerCase() || '';

        return (
          firstName.includes(query) ||
          lastName.includes(query) ||
          defaultTruck.includes(query)
        );
      });
    }

    // Sort drivers
    drivers.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy.value) {
        case 'firstName':
          aValue = a.firstName?.toLowerCase() || '';
          bValue = b.firstName?.toLowerCase() || '';
          break;
        case 'lastName':
          aValue = a.lastName?.toLowerCase() || '';
          bValue = b.lastName?.toLowerCase() || '';
          break;
        case 'defaultTruck':
          aValue = a.defaultTruck?.toLowerCase() || '';
          bValue = b.defaultTruck?.toLowerCase() || '';
          break;
        case 'dateHired':
          aValue = a.dateHired ? new Date(a.dateHired).getTime() : 0;
          bValue = b.dateHired ? new Date(b.dateHired).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder.value === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder.value === 'asc' ? 1 : -1;
      return 0;
    });

    return drivers;
  });

  // Save settings to localStorage whenever they change
  const saveSettings = $(() => {
    const settings: DriversSettings = {
      search: searchQuery.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
    };
    saveSettingsToLocalStorage(settings);
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('highlight')) {
      url.searchParams.delete('highlight');
      history.replaceState(null, '', url.toString());
    }

    // Load from localStorage on mount and sync URL if needed
    const savedShowInactive = getShowInactiveFromLocalStorage();
    const urlHasShowInactive = url.searchParams.get('showInactive') === 'true';

    // If localStorage says true but URL doesn't have it, navigate with the param
    if (savedShowInactive && !urlHasShowInactive) {
      url.searchParams.set('showInactive', 'true');
      window.location.href = url.toString();
    }

    // Load search/sort settings from localStorage
    const savedSettings = getSettingsFromLocalStorage();
    searchQuery.value = savedSettings.search;
    sortBy.value = savedSettings.sortBy;
    sortOrder.value = savedSettings.sortOrder;
  });

  const handleToggle = $(() => {
    const newValue = !showInactive.value;
    showInactive.value = newValue;
    saveShowInactiveToLocalStorage(newValue);

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

      {/* Search and Sort Controls */}
      <div class="card mb-6">
        <div class="flex flex-wrap gap-4 items-end">
          {/* Search Input */}
          <div class="flex-1 min-w-[200px]">
            <label
              for="search"
              class="block text-sm font-medium mb-1"
              style="color: rgb(var(--color-text-secondary))"
            >
              Search Drivers
            </label>
            <input
              type="text"
              id="search"
              value={searchQuery.value}
              placeholder="Search by name or truck..."
              class="w-full"
              onInput$={(e) => {
                searchQuery.value = (e.target as HTMLInputElement).value;
                saveSettings();
              }}
            />
          </div>

          {/* Sort By Dropdown */}
          <div>
            <label
              for="sortBy"
              class="block text-sm font-medium mb-1"
              style="color: rgb(var(--color-text-secondary))"
            >
              Sort By
            </label>
            <select
              id="sortBy"
              value={sortBy.value}
              onChange$={(e) => {
                sortBy.value = (e.target as HTMLSelectElement).value as SortField;
                saveSettings();
              }}
            >
              <option value="defaultTruck">Default Truck</option>
              <option value="firstName">First Name</option>
              <option value="lastName">Last Name</option>
              <option value="dateHired">Date Hired</option>
            </select>
          </div>

          {/* Sort Order Dropdown */}
          <div>
            <label
              for="sortOrder"
              class="block text-sm font-medium mb-1"
              style="color: rgb(var(--color-text-secondary))"
            >
              Order
            </label>
            <select
              id="sortOrder"
              value={sortOrder.value}
              onChange$={(e) => {
                sortOrder.value = (e.target as HTMLSelectElement).value as SortOrder;
                saveSettings();
              }}
            >
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </div>
        </div>
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
        drivers={filteredDrivers.value}
        highlightId={data.value.highlightedId ?? undefined}
      />
    </section>
  );
});
