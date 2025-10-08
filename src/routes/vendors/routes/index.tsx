import { component$, useSignal, useComputed$, $, useVisibleTask$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, zod$, z } from '@builder.io/qwik-city';
import PageSubtitle from '~/components/PageSubtitle';
import { NavLink } from '~/components/NavLink';
import { FreightRoutesTable } from '~/components/vendors/routes/FreightRoutesTable';
import { db } from '~/lib/db';

const SETTINGS_STORAGE_KEY = 'routes-settings';

type SearchField = 'vendorName' | 'destination' | 'vendorLocationName' | 'freightCost';
type SortField = 'vendorName' | 'vendorLocationName' | 'destination' | 'freightCost' | 'status';
type SortOrder = 'asc' | 'desc';

interface RoutesSettings {
  search: string;
  searchField: SearchField;
  sortBy: SortField;
  sortOrder: SortOrder;
}

function saveSettingsToLocalStorage(settings: RoutesSettings) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }
}

function getSettingsFromLocalStorage(): RoutesSettings {
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
    searchField: 'vendorName',
    sortBy: 'vendorName',
    sortOrder: 'asc',
  };
}

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

  // Search and sort state
  const searchQuery = useSignal('');
  const searchField = useSignal<SearchField>('vendorName');
  const sortBy = useSignal<SortField>('vendorName');
  const sortOrder = useSignal<SortOrder>('asc');

  // Computed filtered and sorted routes
  const filteredRoutes = useComputed$(() => {
    let routes = [...routesData.value.routes];

    // Filter by search query
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase();
      routes = routes.filter((route) => {
        switch (searchField.value) {
          case 'vendorName':
            return route.vendorLocation.vendor.name?.toLowerCase().includes(query) || false;
          case 'destination':
            return route.destination?.toLowerCase().includes(query) || false;
          case 'vendorLocationName':
            return route.vendorLocation.name?.toLowerCase().includes(query) || false;
          case 'freightCost':
            return route.freightCost.toFixed(2).startsWith(query);
          default:
            return true;
        }
      });
    }

    // Sort routes with secondary sort by destination
    routes.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy.value) {
        case 'vendorName':
          aValue = a.vendorLocation.vendor.name?.toLowerCase() || '';
          bValue = b.vendorLocation.vendor.name?.toLowerCase() || '';
          break;
        case 'vendorLocationName':
          aValue = a.vendorLocation.name?.toLowerCase() || '';
          bValue = b.vendorLocation.name?.toLowerCase() || '';
          break;
        case 'destination':
          aValue = a.destination?.toLowerCase() || '';
          bValue = b.destination?.toLowerCase() || '';
          break;
        case 'freightCost':
          aValue = a.freightCost;
          bValue = b.freightCost;
          break;
        case 'status':
          aValue = a.isActive ? 1 : 0;
          bValue = b.isActive ? 1 : 0;
          break;
        default:
          return 0;
      }

      // Primary sort
      if (aValue < bValue) return sortOrder.value === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder.value === 'asc' ? 1 : -1;

      // Secondary sort by destination (always ascending)
      const aDestination = a.destination?.toLowerCase() || '';
      const bDestination = b.destination?.toLowerCase() || '';
      if (aDestination < bDestination) return -1;
      if (aDestination > bDestination) return 1;

      return 0;
    });

    return routes;
  });

  // Save settings to localStorage whenever they change
  const saveSettings = $(() => {
    const settings: RoutesSettings = {
      search: searchQuery.value,
      searchField: searchField.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
    };
    saveSettingsToLocalStorage(settings);
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    // Load search/sort settings from localStorage
    const savedSettings = getSettingsFromLocalStorage();
    searchQuery.value = savedSettings.search;
    searchField.value = savedSettings.searchField;
    sortBy.value = savedSettings.sortBy;
    sortOrder.value = savedSettings.sortOrder;
  });

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

      {/* Search and Sort Controls */}
      <div class="card mb-6">
        <div class="flex flex-wrap gap-4 items-end">
          {/* Search Field Dropdown */}
          <div>
            <label
              for="searchField"
              class="block text-sm font-medium mb-1"
              style="color: rgb(var(--color-text-secondary))"
            >
              Search By
            </label>
            <select
              id="searchField"
              value={searchField.value}
              onChange$={(e) => {
                searchField.value = (e.target as HTMLSelectElement).value as SearchField;
                searchQuery.value = ''; // Clear search when changing field
                saveSettings();
              }}
            >
              <option value="vendorName">Vendor Name</option>
              <option value="destination">Destination</option>
              <option value="vendorLocationName">Vendor Location Name</option>
              <option value="freightCost">Freight Cost</option>
            </select>
          </div>

          {/* Search Input */}
          <div class="flex-1 min-w-[200px]">
            <label
              for="search"
              class="block text-sm font-medium mb-1"
              style="color: rgb(var(--color-text-secondary))"
            >
              Search
            </label>
            <input
              type="text"
              id="search"
              value={searchQuery.value}
              placeholder={
                searchField.value === 'freightCost'
                  ? 'e.g., 25.50'
                  : `Search by ${searchField.value === 'vendorName' ? 'vendor name' : searchField.value === 'destination' ? 'destination' : 'location name'}...`
              }
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
              <option value="vendorName">Vendor Name</option>
              <option value="vendorLocationName">Vendor Location Name</option>
              <option value="destination">Destination</option>
              <option value="freightCost">Freight Cost</option>
              <option value="status">Status</option>
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

      <FreightRoutesTable
        routes={filteredRoutes.value}
        highlightId={routesData.value.highlightId ?? undefined}
      />
    </section>
  );
});
