import { component$, useSignal, useComputed$, useVisibleTask$, $ } from '@builder.io/qwik';
import { routeLoader$, useLocation, useNavigate } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import PageTitle from '~/components/PageTitle';
import { EditIcon } from '~/components/icons';

export const useVendorsOverviewLoader = routeLoader$(async () => {
  const vendors = await db.vendor.findMany({
    include: {
      vendorLocations: {
        include: {
          vendorProducts: {
            orderBy: { name: 'asc' },
          },
          freightRoutes: {
            orderBy: { destination: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  return { vendors };
});

const STORAGE_KEYS = {
  search: 'vendors-overview-search',
  expandedVendors: 'vendors-overview-expanded-vendors',
  expandedLocations: 'vendors-overview-expanded-locations',
  selectedProduct: 'vendors-overview-selected-product',
};

function saveToLocalStorage(key: string, value: string) {
  if (typeof window !== 'undefined') {
    if (value) {
      localStorage.setItem(key, value);
    } else {
      localStorage.removeItem(key);
    }
  }
}

function getFromLocalStorage(key: string): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key);
  }
  return null;
}

export default component$(() => {
  const data = useVendorsOverviewLoader();
  const loc = useLocation();
  const nav = useNavigate();

  // State
  const searchQuery = useSignal<string>('');
  const expandedVendors = useSignal<Set<number>>(new Set());
  const expandedLocations = useSignal<Set<number>>(new Set());
  const selectedProductId = useSignal<number | null>(null);
  const highlightedProductId = useSignal<number | null>(null);
  const quickInfoOption = useSignal<'A' | 'B'>('B'); // Toggle between options

  // Initialize from URL and localStorage
  useVisibleTask$(() => {
    // Get search from URL or localStorage
    const urlSearch = loc.url.searchParams.get('search');
    const storedSearch = getFromLocalStorage(STORAGE_KEYS.search);
    searchQuery.value = urlSearch || storedSearch || '';

    // Restore expanded state
    const storedVendors = getFromLocalStorage(STORAGE_KEYS.expandedVendors);
    if (storedVendors) {
      expandedVendors.value = new Set(JSON.parse(storedVendors));
    }

    const storedLocations = getFromLocalStorage(STORAGE_KEYS.expandedLocations);
    if (storedLocations) {
      expandedLocations.value = new Set(JSON.parse(storedLocations));
    }

    // Restore selected product
    const storedProduct = getFromLocalStorage(STORAGE_KEYS.selectedProduct);
    if (storedProduct) {
      selectedProductId.value = parseInt(storedProduct);
      highlightedProductId.value = parseInt(storedProduct);
    }
  });

  // Search matching logic
  const searchMatches = useComputed$(() => {
    if (!searchQuery.value.trim()) return null;

    const query = searchQuery.value.toLowerCase();
    const matches = {
      vendors: new Set<number>(),
      locations: new Set<number>(),
      products: new Set<number>(),
      routes: new Set<number>(),
    };

    data.value.vendors.forEach((vendor) => {
      // Check vendor name
      if (vendor.name.toLowerCase().includes(query) ||
          vendor.shortName.toLowerCase().includes(query)) {
        matches.vendors.add(vendor.id);
      }

      vendor.vendorLocations.forEach((location) => {
        // Check location name
        if (location.name.toLowerCase().includes(query)) {
          matches.locations.add(location.id);
          matches.vendors.add(vendor.id);
        }

        location.vendorProducts.forEach((product) => {
          // Check product name
          if (product.name.toLowerCase().includes(query)) {
            matches.products.add(product.id);
            matches.locations.add(location.id);
            matches.vendors.add(vendor.id);
          }
        });

        location.freightRoutes.forEach((route) => {
          // Check route destination
          if (route.destination.toLowerCase().includes(query)) {
            matches.routes.add(route.id);
            matches.locations.add(location.id);
            matches.vendors.add(vendor.id);
          }
        });
      });
    });

    return matches;
  });

  // Auto-expand search results
  useVisibleTask$(({ track }) => {
    const matches = track(() => searchMatches.value);
    if (matches && searchQuery.value.trim()) {
      expandedVendors.value = new Set(matches.vendors);
      expandedLocations.value = new Set(matches.locations);
    }
  });

  // Update URL when search changes
  const handleSearchChange = $((value: string) => {
    searchQuery.value = value;
    saveToLocalStorage(STORAGE_KEYS.search, value);

    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set('search', value);
    } else {
      url.searchParams.delete('search');
    }
    nav(url.pathname + url.search);
  });

  // Toggle vendor expansion
  const toggleVendor = $((vendorId: number) => {
    const newExpanded = new Set(expandedVendors.value);
    if (newExpanded.has(vendorId)) {
      newExpanded.delete(vendorId);
    } else {
      newExpanded.add(vendorId);
    }
    expandedVendors.value = newExpanded;
    saveToLocalStorage(STORAGE_KEYS.expandedVendors, JSON.stringify([...newExpanded]));
  });

  // Toggle location expansion
  const toggleLocation = $((locationId: number) => {
    const newExpanded = new Set(expandedLocations.value);
    if (newExpanded.has(locationId)) {
      newExpanded.delete(locationId);
    } else {
      newExpanded.add(locationId);
    }
    expandedLocations.value = newExpanded;
    saveToLocalStorage(STORAGE_KEYS.expandedLocations, JSON.stringify([...newExpanded]));
  });

  // Select product (for quick info)
  const selectProduct = $((productId: number) => {
    selectedProductId.value = productId;
    highlightedProductId.value = productId;
    saveToLocalStorage(STORAGE_KEYS.selectedProduct, productId.toString());
  });

  // Get selected product details
  const selectedProductDetails = useComputed$(() => {
    if (!selectedProductId.value) return null;

    for (const vendor of data.value.vendors) {
      for (const location of vendor.vendorLocations) {
        const product = location.vendorProducts.find(p => p.id === selectedProductId.value);
        if (product) {
          const yardRoute = location.freightRoutes.find(r => r.toYard && r.isActive);
          return {
            product,
            vendor,
            location,
            yardRoute,
          };
        }
      }
    }
    return null;
  });

  // Format currency
  const formatCurrency = (num: number): string => {
    return `$${num.toFixed(2)}`;
  };

  // Filter vendors based on search
  const filteredVendors = useComputed$(() => {
    if (!searchQuery.value.trim() || !searchMatches.value) {
      return data.value.vendors;
    }
    return data.value.vendors.filter(v => searchMatches.value!.vendors.has(v.id));
  });

  return (
    <section class="space-y-6">
      <PageTitle text="Vendors Overview" />

      {/* Search Bar */}
      <div class="card">
        <div class="flex gap-4 items-end">
          <div class="flex-1">
            <label
              for="search"
              class="block text-sm font-medium mb-2"
              style="color: rgb(var(--color-text-secondary))"
            >
              Search by Vendor, Location, Product, or Route
            </label>
            <input
              id="search"
              type="text"
              value={searchQuery.value}
              onInput$={(e) => handleSearchChange((e.target as HTMLInputElement).value)}
              placeholder="Type to search..."
              class="w-full"
            />
          </div>
          <div class="flex gap-2">
            <button
              class="btn btn-ghost btn-sm"
              onClick$={() => {
                quickInfoOption.value = quickInfoOption.value === 'A' ? 'B' : 'A';
              }}
            >
              Toggle Info View ({quickInfoOption.value})
            </button>
          </div>
        </div>
        {searchQuery.value && (
          <p class="text-sm mt-2" style="color: rgb(var(--color-text-secondary))">
            {filteredVendors.value.length} vendor(s) found
          </p>
        )}
      </div>

      {/* Quick Info Panel - Option B (Floating Card) */}
      {quickInfoOption.value === 'B' && selectedProductDetails.value && (
        <div class="card" style="background-color: rgb(var(--color-primary) / 0.05); border: 2px solid rgb(var(--color-primary))">
          <div class="flex justify-between items-start mb-3">
            <h3 class="font-semibold text-lg" style="color: rgb(var(--color-text-primary))">
              Quick Info: {selectedProductDetails.value.product.name}
            </h3>
            <button
              class="btn-icon"
              onClick$={() => {
                selectedProductId.value = null;
                highlightedProductId.value = null;
                saveToLocalStorage(STORAGE_KEYS.selectedProduct, '');
              }}
            >
              ✕
            </button>
          </div>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span style="color: rgb(var(--color-text-secondary))">Vendor:</span>
              <span class="font-medium">{selectedProductDetails.value.vendor.name}</span>
            </div>
            <div class="flex justify-between">
              <span style="color: rgb(var(--color-text-secondary))">Location:</span>
              <span class="font-medium">{selectedProductDetails.value.location.name}</span>
            </div>
            <div class="flex justify-between">
              <span style="color: rgb(var(--color-text-secondary))">Product Cost:</span>
              <span class="font-medium">{formatCurrency(selectedProductDetails.value.product.productCost)}</span>
            </div>
            {selectedProductDetails.value.yardRoute ? (
              <>
                <div class="flex justify-between">
                  <span style="color: rgb(var(--color-text-secondary))">Freight Cost (Yard):</span>
                  <span class="font-medium">{formatCurrency(selectedProductDetails.value.yardRoute.freightCost)}</span>
                </div>
                <div class="flex justify-between">
                  <span style="color: rgb(var(--color-text-secondary))">CHT Fuel Surcharge:</span>
                  <span class="font-medium">{formatCurrency(selectedProductDetails.value.vendor.chtFuelSurcharge)}</span>
                </div>
                <div class="flex justify-between pt-2 mt-2 border-t" style="border-color: rgb(var(--color-border))">
                  <span class="font-semibold" style="color: rgb(var(--color-text-primary))">Total Per Ton:</span>
                  <span class="font-semibold text-lg" style="color: rgb(var(--color-primary))">
                    {formatCurrency(
                      selectedProductDetails.value.product.productCost +
                      selectedProductDetails.value.yardRoute.freightCost +
                      selectedProductDetails.value.vendor.chtFuelSurcharge
                    )}
                  </span>
                </div>
              </>
            ) : (
              <p class="text-sm" style="color: rgb(var(--color-warning))">
                No yard route available for this product
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main Table */}
      <div class="table-container">
        <table class="table-modern">
          <thead>
            <tr>
              <th style="width: 50px"></th>
              <th>Name</th>
              <th>Type</th>
              <th>Details</th>
              <th style="width: 150px">Status</th>
              <th style="width: 100px">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVendors.value.length === 0 ? (
              <tr>
                <td colSpan={6} class="text-center py-8" style="color: rgb(var(--color-text-secondary))">
                  {searchQuery.value ? 'No results found' : 'No vendors available'}
                </td>
              </tr>
            ) : (
              filteredVendors.value.map((vendor) => {
                const isVendorExpanded = expandedVendors.value.has(vendor.id);
                const isSearchMatch = searchMatches.value?.vendors.has(vendor.id);

                return (
                  <>
                    {/* Vendor Row */}
                    <tr
                      key={vendor.id}
                      class={!vendor.isActive ? 'row-inactive' : ''}
                      style={isSearchMatch && searchQuery.value ? 'background-color: rgb(var(--color-warning) / 0.1)' : ''}
                    >
                      <td>
                        <button
                          class="btn-icon"
                          onClick$={() => toggleVendor(vendor.id)}
                        >
                          {isVendorExpanded ? '▼' : '▶'}
                        </button>
                      </td>
                      <td class="font-medium">{vendor.name}</td>
                      <td>
                        <span class="badge badge-secondary">Vendor</span>
                      </td>
                      <td>
                        {vendor.shortName} • {vendor.vendorLocations.length} location(s)
                      </td>
                      <td>
                        <span class={vendor.isActive ? 'badge badge-success' : 'badge badge-danger'}>
                          {vendor.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div class="flex gap-2">
                          <a href={`/vendors/edit/${vendor.id}?returnTo=/vendors/overview`} class="btn-icon btn-icon-primary">
                            <EditIcon size={16} />
                          </a>
                        </div>
                      </td>
                    </tr>

                    {/* Vendor Locations (Level 2) */}
                    {isVendorExpanded && vendor.vendorLocations.map((location) => {
                      const isLocationExpanded = expandedLocations.value.has(location.id);
                      const isLocationMatch = searchMatches.value?.locations.has(location.id);

                      return (
                        <>
                          <tr
                            key={`loc-${location.id}`}
                            class={!location.isActive ? 'row-inactive' : ''}
                            style={`background-color: rgb(var(--color-bg-secondary)); ${isLocationMatch && searchQuery.value ? 'border-left: 3px solid rgb(var(--color-warning));' : ''}`}
                          >
                            <td style="padding-left: 2rem">
                              <button
                                class="btn-icon"
                                onClick$={() => toggleLocation(location.id)}
                              >
                                {isLocationExpanded ? '▼' : '▶'}
                              </button>
                            </td>
                            <td class="font-medium">{location.name}</td>
                            <td>
                              <span class="badge badge-secondary">Location</span>
                            </td>
                            <td>
                              {location.vendorProducts.length} product(s) • {location.freightRoutes.length} route(s)
                            </td>
                            <td>
                              <span class={location.isActive ? 'badge badge-success' : 'badge badge-danger'}>
                                {location.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <div class="flex gap-2">
                                <a href={`/vendors/locations/edit/${location.id}?returnTo=/vendors/overview`} class="btn-icon btn-icon-primary">
                                  <EditIcon size={16} />
                                </a>
                              </div>
                            </td>
                          </tr>

                          {/* Products & Routes (Level 3) */}
                          {isLocationExpanded && (
                            <tr key={`loc-${location.id}-details`}>
                              <td colSpan={6} style="padding: 0; background-color: rgb(var(--color-bg-secondary))">
                                <div class="p-4" style="padding-left: 4rem">
                                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* Products */}
                                    <div>
                                      <h4 class="font-semibold mb-3" style="color: rgb(var(--color-text-primary))">
                                        Products ({location.vendorProducts.length})
                                      </h4>
                                      {location.vendorProducts.length === 0 ? (
                                        <p class="text-sm" style="color: rgb(var(--color-text-secondary))">
                                          No products
                                        </p>
                                      ) : (
                                        <div class="space-y-2" style="max-height: 400px; overflow-y: auto; padding-right: 0.5rem;">
                                          {location.vendorProducts.map((product) => {
                                            const isProductMatch = searchMatches.value?.products.has(product.id);
                                            const isSelected = highlightedProductId.value === product.id;
                                            const yardRoute = location.freightRoutes.find(r => r.toYard && r.isActive);

                                            return (
                                              <div
                                                key={product.id}
                                                class="p-2 rounded-lg cursor-pointer transition-all"
                                                style={{
                                                  backgroundColor: isSelected
                                                    ? 'rgb(var(--color-primary) / 0.15)'
                                                    : isProductMatch && searchQuery.value
                                                    ? 'rgb(var(--color-warning) / 0.15)'
                                                    : 'rgb(var(--color-surface))',
                                                  border: isSelected
                                                    ? '2px solid rgb(var(--color-primary))'
                                                    : '1px solid rgb(var(--color-border))',
                                                }}
                                                onClick$={() => selectProduct(product.id)}
                                              >
                                                <div class="flex justify-between items-center gap-2 mb-1">
                                                  <span class="font-medium text-sm" style="color: rgb(var(--color-text-primary))">
                                                    {product.name}
                                                  </span>
                                                  <div class="flex items-center gap-1">
                                                    <a
                                                      href={`/vendors/products/edit/${product.id}?returnTo=/vendors/overview`}
                                                      class="btn-icon btn-icon-primary"
                                                      style="padding: 0.25rem;"
                                                      onClick$={(e) => e.stopPropagation()}
                                                    >
                                                      <EditIcon size={12} />
                                                    </a>
                                                    <span class={product.isActive ? 'badge badge-success' : 'badge badge-danger'} style="font-size: 0.65rem; padding: 0.125rem 0.5rem;">
                                                      {product.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                  </div>
                                                </div>
                                                <div class="flex justify-between text-xs">
                                                  <span style="color: rgb(var(--color-text-secondary))">Cost:</span>
                                                  <span class="font-medium">{formatCurrency(product.productCost)}</span>
                                                </div>
                                                {yardRoute && (
                                                  <div class="flex justify-between text-xs pt-1 mt-1 border-t" style="border-color: rgb(var(--color-border))">
                                                    <span style="color: rgb(var(--color-text-secondary))">Yard Total/T:</span>
                                                    <span class="font-semibold" style="color: rgb(var(--color-primary))">
                                                      {formatCurrency(
                                                        product.productCost +
                                                        yardRoute.freightCost +
                                                        vendor.chtFuelSurcharge
                                                      )}
                                                    </span>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>

                                    {/* Freight Routes */}
                                    <div>
                                      <h4 class="font-semibold mb-3" style="color: rgb(var(--color-text-primary))">
                                        Freight Routes ({location.freightRoutes.length})
                                      </h4>
                                      {location.freightRoutes.length === 0 ? (
                                        <p class="text-sm" style="color: rgb(var(--color-text-secondary))">
                                          No freight routes
                                        </p>
                                      ) : (
                                        <>
                                          {/* Yard Route (pinned at top) */}
                                          {location.freightRoutes.filter(r => r.toYard).map((route) => {
                                            const isRouteMatch = searchMatches.value?.routes.has(route.id);
                                            const shouldHighlight = quickInfoOption.value === 'A' &&
                                                                   route.toYard &&
                                                                   selectedProductId.value &&
                                                                   location.vendorProducts.some(p => p.id === selectedProductId.value);

                                            return (
                                              <div
                                                key={route.id}
                                                class="p-2 rounded-lg mb-2"
                                                style={{
                                                  backgroundColor: shouldHighlight
                                                    ? 'rgb(var(--color-primary) / 0.15)'
                                                    : isRouteMatch && searchQuery.value
                                                    ? 'rgb(var(--color-warning) / 0.15)'
                                                    : 'rgb(var(--color-surface))',
                                                  border: shouldHighlight
                                                    ? '2px solid rgb(var(--color-primary))'
                                                    : '1px solid rgb(var(--color-border))',
                                                }}
                                              >
                                                <div class="flex justify-between items-center gap-2 mb-1">
                                                  <span class="font-medium text-sm" style="color: rgb(var(--color-text-primary))">
                                                    {route.destination}
                                                    <span class="badge badge-success ml-1" style="font-size: 0.6rem; padding: 0.125rem 0.375rem;">
                                                      YARD
                                                    </span>
                                                  </span>
                                                  <div class="flex items-center gap-1">
                                                    <a href={`/vendors/routes/${route.id}/edit?returnTo=/vendors/overview`} class="btn-icon btn-icon-primary" style="padding: 0.25rem;">
                                                      <EditIcon size={12} />
                                                    </a>
                                                    <span class={route.isActive ? 'badge badge-success' : 'badge badge-danger'} style="font-size: 0.65rem; padding: 0.125rem 0.5rem;">
                                                      {route.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                  </div>
                                                </div>
                                                <div class="flex justify-between text-xs">
                                                  <span style="color: rgb(var(--color-text-secondary))">Freight:</span>
                                                  <span class="font-medium">{formatCurrency(route.freightCost)}</span>
                                                </div>
                                              </div>
                                            );
                                          })}

                                          {/* Other Routes (in scrollable container) */}
                                          {location.freightRoutes.filter(r => !r.toYard).length > 0 && (
                                            <div class="space-y-2" style="max-height: 300px; overflow-y: auto; padding-right: 0.5rem;">
                                              {location.freightRoutes.filter(r => !r.toYard).map((route) => {
                                            const isRouteMatch = searchMatches.value?.routes.has(route.id);

                                            return (
                                              <div
                                                key={route.id}
                                                class="p-2 rounded-lg"
                                                style={{
                                                  backgroundColor: isRouteMatch && searchQuery.value
                                                    ? 'rgb(var(--color-warning) / 0.15)'
                                                    : 'rgb(var(--color-surface))',
                                                  border: '1px solid rgb(var(--color-border))',
                                                }}
                                              >
                                                <div class="flex justify-between items-center gap-2 mb-1">
                                                  <span class="font-medium text-sm" style="color: rgb(var(--color-text-primary))">
                                                    {route.destination}
                                                  </span>
                                                  <div class="flex items-center gap-1">
                                                    <a href={`/vendors/routes/${route.id}/edit?returnTo=/vendors/overview`} class="btn-icon btn-icon-primary" style="padding: 0.25rem;">
                                                      <EditIcon size={12} />
                                                    </a>
                                                    <span class={route.isActive ? 'badge badge-success' : 'badge badge-danger'} style="font-size: 0.65rem; padding: 0.125rem 0.5rem;">
                                                      {route.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                  </div>
                                                </div>
                                                <div class="flex justify-between text-xs">
                                                  <span style="color: rgb(var(--color-text-secondary))">Freight:</span>
                                                  <span class="font-medium">{formatCurrency(route.freightCost)}</span>
                                                </div>
                                              </div>
                                            );
                                          })}
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
});
