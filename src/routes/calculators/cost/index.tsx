import {
  component$,
  useSignal,
  useComputed$,
  useVisibleTask$,
  $,
} from '@builder.io/qwik';
import { useNavigate, useLocation } from '@builder.io/qwik-city';
import PageTitle from '~/components/PageTitle';
import { NavLink } from '~/components/NavLink';
import { PrintIcon } from '~/components/icons';
import type { Driver } from '~/types/driver';

interface FreightRoute {
  id: number;
  destination: string;
  freightCost: number;
  toYard: boolean;
  isDummy?: boolean; // For placeholder C&H Yard route
}

interface VendorProduct {
  id: number;
  name: string;
  productCost: number;
  notes: string;
  vendorId: number;
  vendorName: string;
  vendorShortName: string;
  chtFuelSurcharge: number;
  vendorLocationId: number;
  vendorLocationName: string;
  freightRoutes: FreightRoute[];
}

interface FormState {
  tons: number;
  materialInput: string;
  selectedProductId: number | null;
  selectedRouteId: number | null;
  outboundTruck: boolean;
  selectedDriverId: number | null;
  selectedDate: string;
}

const STORAGE_KEY = 'cost-calculator-state';

export default component$(() => {
  const nav = useNavigate();
  const loc = useLocation();

  // Signals for form inputs
  const tons = useSignal<number>(0);
  const materialInput = useSignal<string>('');
  const selectedProduct = useSignal<VendorProduct | null>(null);
  const showAutocomplete = useSignal<boolean>(false);
  const autocompleteIndex = useSignal<number>(-1);
  const outboundTruck = useSignal<boolean>(false);

  // Signals for freight route selection
  const selectedRoute = useSignal<FreightRoute | null>(null);
  const routeSearchInput = useSignal<string>('');
  const showRouteAutocomplete = useSignal<boolean>(false);
  const routeAutocompleteIndex = useSignal<number>(-1);

  // Signals for data
  const allProducts = useSignal<VendorProduct[]>([]);
  const drivers = useSignal<Driver[]>([]);
  const selectedDriver = useSignal<Driver | null>(null);
  const selectedDate = useSignal<string>(
    new Date().toISOString().split('T')[0],
  ); // Default to today
  const isLoading = useSignal<boolean>(true);

  // Computed values for autocomplete filtering
  const filteredProducts = useComputed$(() => {
    if (!materialInput.value) return [];
    const search = materialInput.value.toLowerCase();
    return allProducts.value.filter((product) => {
      const displayName =
        `${product.name} (${product.vendorShortName} - ${product.vendorLocationName})`.toLowerCase();
      return displayName.includes(search);
    });
  });

  // Computed values for available routes (with C&H Yard always first)
  const availableRoutes = useComputed$<FreightRoute[]>(() => {
    if (!selectedProduct.value) return [];

    const routes = selectedProduct.value.freightRoutes;
    const yardRoute = routes.find((r) => r.toYard);

    // Always include C&H Yard as first option to encourage users to set up yard routes
    if (yardRoute) {
      // Real yard route exists - prioritize it at the top of the list
      const otherRoutes = routes.filter((r) => !r.toYard);
      return [yardRoute, ...otherRoutes];
    } else {
      // Create dummy placeholder for C&H Yard to show users this route needs setup
      // Selecting this dummy will prompt user to create the actual yard route
      const dummyYardRoute: FreightRoute = {
        id: -1,
        destination: 'C&H Yard',
        freightCost: 0,
        toYard: true,
        isDummy: true, // Flag indicates this is a placeholder, not a real route
      };
      return [dummyYardRoute, ...routes];
    }
  });

  // Computed values for filtered routes based on search
  const filteredRoutes = useComputed$(() => {
    if (!routeSearchInput.value) return availableRoutes.value;
    const search = routeSearchInput.value.toLowerCase();
    return availableRoutes.value.filter((route) =>
      route.destination.toLowerCase().includes(search),
    );
  });

  // Check if C&H Yard route is missing
  const isCHYardMissing = useComputed$(() => {
    return selectedRoute.value?.isDummy === true;
  });

  // Computed calculations
  const costPerTon = useComputed$(() => {
    if (
      !selectedProduct.value ||
      !selectedRoute.value ||
      selectedRoute.value.isDummy
    )
      return 0;

    // Total cost formula: Base product cost + Delivery freight + Fuel surcharge
    // This represents the complete per-ton cost to deliver material to destination
    return (
      selectedProduct.value.productCost +
      selectedRoute.value.freightCost +
      selectedProduct.value.chtFuelSurcharge
    );
  });

  const totalCost = useComputed$(() => {
    // Multiply per-ton cost by quantity to get total order cost
    return costPerTon.value * tons.value;
  });

  const quantityYards = useComputed$(() => {
    // Industry standard conversion: 1 cubic yard ≈ 1.35 tons for typical aggregates
    // This conversion factor accounts for the density of common landscape materials
    return tons.value / 1.35;
  });

  const costPerYard = useComputed$(() => {
    // Convert per-ton pricing to per-yard pricing using same 1.35 factor
    return costPerTon.value * 1.35;
  });

  const chtFuelSurchargeTotal = useComputed$(() => {
    if (!selectedProduct.value) return 0;
    return selectedProduct.value.chtFuelSurcharge * tons.value;
  });

  // Save form state to localStorage
  const saveFormState = $(() => {
    const state: FormState = {
      tons: tons.value,
      materialInput: materialInput.value,
      selectedProductId: selectedProduct.value?.id || null,
      selectedRouteId: selectedRoute.value?.id || null,
      outboundTruck: outboundTruck.value,
      selectedDriverId: selectedDriver.value?.id || null,
      selectedDate: selectedDate.value,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  });

  // Restore form state from localStorage
  const restoreFormState = $(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const state: FormState = JSON.parse(saved);
      tons.value = state.tons;
      materialInput.value = state.materialInput;
      outboundTruck.value = state.outboundTruck;
      selectedDate.value =
        state.selectedDate || new Date().toISOString().split('T')[0];

      // Find and restore selected product
      if (state.selectedProductId) {
        const product = allProducts.value.find(
          (p) => p.id === state.selectedProductId,
        );
        if (product) {
          selectedProduct.value = product;

          // Find and restore selected route
          if (state.selectedRouteId) {
            const route = product.freightRoutes.find(
              (r) => r.id === state.selectedRouteId,
            );
            if (route) {
              selectedRoute.value = route;
              routeSearchInput.value = route.destination;
            }
          }
        }
      }

      // Find and restore selected driver
      if (state.selectedDriverId) {
        const driver = drivers.value.find(
          (d) => d.id === state.selectedDriverId,
        );
        if (driver) {
          selectedDriver.value = driver;
        }
      }

      // Clear saved state after restoration
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to restore form state:', error);
    }
  });

  // Fetch vendor products on mount
  useVisibleTask$(async ({ track }) => {
    track(() => loc.url.searchParams.get('newRouteId'));

    try {
      // Fetch vendor products and drivers in parallel
      const [productsResponse, driversResponse] = await Promise.all([
        fetch('/api/vendor-products'),
        fetch('/api/drivers'), // We'll need to create this endpoint
      ]);

      const productsData = await productsResponse.json();
      if (productsData.success) {
        allProducts.value = productsData.products;
      }

      // Handle drivers response - create a fallback if endpoint doesn't exist yet
      try {
        const driversData = await driversResponse.json();
        if (driversData.success && driversData.drivers) {
          drivers.value = driversData.drivers;
        }
      } catch (driverError) {
        console.log('Drivers API not available yet, using empty array');
        drivers.value = [];
      }

      // Restore form state if returning from new route page
      const newRouteId = loc.url.searchParams.get('newRouteId');
      if (newRouteId) {
        await restoreFormState();

        // Refresh selectedProduct with updated data to ensure all routes are available
        if (selectedProduct.value) {
          const updatedProduct = allProducts.value.find(
            (p) => p.id === selectedProduct.value!.id,
          );
          if (updatedProduct) {
            selectedProduct.value = updatedProduct;
          }

          // Auto-select the newly created route
          const newRoute = selectedProduct.value.freightRoutes.find(
            (r) => r.id === parseInt(newRouteId),
          );
          if (newRoute) {
            selectedRoute.value = newRoute;
            routeSearchInput.value = newRoute.destination;
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      isLoading.value = false;
    }
  });

  // Format number to 2 decimals
  const formatNumber = (num: number): string => {
    return num.toFixed(2);
  };

  // Format currency
  const formatCurrency = (num: number): string => {
    return `$${formatNumber(num)}`;
  };

  // Handle material selection
  const selectProduct = $((product: VendorProduct) => {
    selectedProduct.value = product;
    materialInput.value = `${product.name} (${product.vendorShortName} - ${product.vendorLocationName})`;
    showAutocomplete.value = false;
    autocompleteIndex.value = -1;

    // Auto-select first route (C&H Yard or dummy)
    const routes = product.freightRoutes;
    const yardRoute = routes.find((r) => r.toYard);

    if (yardRoute) {
      selectedRoute.value = yardRoute;
      routeSearchInput.value = yardRoute.destination;
    } else {
      // Select dummy C&H Yard
      selectedRoute.value = {
        id: -1,
        destination: 'C&H Yard',
        freightCost: 0,
        toYard: true,
        isDummy: true,
      };
      routeSearchInput.value = 'C&H Yard';
    }
  });

  // Handle route selection
  const selectRoute = $((route: FreightRoute) => {
    selectedRoute.value = route;
    routeSearchInput.value = route.destination;
    showRouteAutocomplete.value = false;
    routeAutocompleteIndex.value = -1;
  });

  // Handle navigation to new route page
  const navigateToNewRoute = $(async (prefillVendor: boolean = false) => {
    // Save current form state
    await saveFormState();

    // Build return URL
    const returnTo = encodeURIComponent(loc.url.pathname);

    // Build new route URL with params
    let url = `/vendors/routes/new?returnTo=${returnTo}`;

    if (prefillVendor && selectedProduct.value) {
      url += `&vendorId=${selectedProduct.value.vendorId}`;
      url += `&locationId=${selectedProduct.value.vendorLocationId}`;
    }

    await nav(url);
  });

  // Handle print button
  const handlePrint = $(async () => {
    if (
      !selectedProduct.value ||
      !selectedRoute.value ||
      selectedRoute.value.isDummy
    ) {
      alert('Please select a valid material and freight route');
      return;
    }

    const breakdownData = {
      vendor: {
        id: selectedProduct.value.vendorId,
        name: selectedProduct.value.vendorName,
        shortName: selectedProduct.value.vendorShortName,
        chtFuelSurcharge: selectedProduct.value.chtFuelSurcharge,
      },
      material: {
        id: selectedProduct.value.id,
        name: selectedProduct.value.name,
        productCost: selectedProduct.value.productCost,
        notes: selectedProduct.value.notes,
        vendorId: selectedProduct.value.vendorId,
        vendorLocationId: selectedProduct.value.vendorLocationId,
      },
      location: selectedProduct.value.vendorLocationName,
      route: {
        id: selectedRoute.value.id,
        destination: selectedRoute.value.destination,
        freightCost: selectedRoute.value.freightCost,
      },
      tons: tons.value,
      product: selectedProduct.value.productCost,
      freightToYard: selectedRoute.value.freightCost,
      chtFuelSurcharge: selectedProduct.value.chtFuelSurcharge,
      yards: quantityYards.value,
      costPerYard: costPerYard.value,
      costPerTon: costPerTon.value,
      totalCostTons: totalCost.value,
    };

    const params = new URLSearchParams({
      breakdownData: JSON.stringify(breakdownData),
      outbound: outboundTruck.value.toString(),
      driverId: selectedDriver.value?.id.toString() || '',
      date: selectedDate.value,
    });

    await nav(`/calculators/cost/print?${params.toString()}`);
  });

  // Handle keyboard navigation for material autocomplete
  const handleKeyDown = $((event: KeyboardEvent) => {
    if (!showAutocomplete.value || filteredProducts.value.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      autocompleteIndex.value = Math.min(
        autocompleteIndex.value + 1,
        filteredProducts.value.length - 1,
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      autocompleteIndex.value = Math.max(autocompleteIndex.value - 1, -1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (autocompleteIndex.value >= 0) {
        selectProduct(filteredProducts.value[autocompleteIndex.value]);
      }
    } else if (event.key === 'Escape') {
      showAutocomplete.value = false;
      autocompleteIndex.value = -1;
    } else if (event.key === 'Tab') {
      if (autocompleteIndex.value >= 0) {
        event.preventDefault();
        selectProduct(filteredProducts.value[autocompleteIndex.value]);
      } else if (filteredProducts.value.length > 0) {
        event.preventDefault();
        selectProduct(filteredProducts.value[0]);
      }
    }
  });

  // Handle keyboard navigation for route autocomplete
  const handleRouteKeyDown = $((event: KeyboardEvent) => {
    if (!showRouteAutocomplete.value || filteredRoutes.value.length === 0)
      return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      routeAutocompleteIndex.value = Math.min(
        routeAutocompleteIndex.value + 1,
        filteredRoutes.value.length - 1,
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      routeAutocompleteIndex.value = Math.max(
        routeAutocompleteIndex.value - 1,
        -1,
      );
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (routeAutocompleteIndex.value >= 0) {
        selectRoute(filteredRoutes.value[routeAutocompleteIndex.value]);
      }
    } else if (event.key === 'Escape') {
      showRouteAutocomplete.value = false;
      routeAutocompleteIndex.value = -1;
    } else if (event.key === 'Tab') {
      if (routeAutocompleteIndex.value >= 0) {
        event.preventDefault();
        selectRoute(filteredRoutes.value[routeAutocompleteIndex.value]);
      } else if (filteredRoutes.value.length > 0) {
        event.preventDefault();
        selectRoute(filteredRoutes.value[0]);
      }
    }
  });

  return (
    <section class="space-y-6">
      <div class="flex items-center justify-between">
        <PageTitle text="Cost Calculator" />
        <NavLink href="/calculators">Back to Calculators</NavLink>
      </div>

      {isLoading.value ? (
        <div class="text-center py-8">
          <p class="text-lg" style="color: rgb(var(--color-text-secondary))">
            Loading...
          </p>
        </div>
      ) : (
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Input */}
          <div class="card space-y-4">
            <h2 class="card-title">Input</h2>

            {/* Outbound Truck Checkbox */}
            <div class="flex items-center gap-2">
              <input
                id="outboundTruck"
                type="checkbox"
                checked={outboundTruck.value}
                onChange$={(e) => {
                  outboundTruck.value = (e.target as HTMLInputElement).checked;
                }}
              />
              <label
                for="outboundTruck"
                class="text-sm font-medium cursor-pointer"
                style="color: rgb(var(--color-text-secondary))"
              >
                Outbound Truck
              </label>
            </div>

            {/* Tons Input */}
            <div>
              <label
                for="tons"
                class="block text-sm font-medium mb-2"
                style="color: rgb(var(--color-text-secondary))"
              >
                Tons
              </label>
              <input
                id="tons"
                type="number"
                step="0.01"
                min="0"
                value={tons.value}
                onInput$={(e) => {
                  tons.value =
                    parseFloat((e.target as HTMLInputElement).value) || 0;
                }}
                class="w-full"
              />
            </div>

            {/* Material Input with Autocomplete */}
            <div class="relative">
              <label
                for="material"
                class="block text-sm font-medium mb-2"
                style="color: rgb(var(--color-text-secondary))"
              >
                Material
              </label>
              <input
                id="material"
                type="text"
                value={materialInput.value}
                onInput$={(e) => {
                  materialInput.value = (e.target as HTMLInputElement).value;
                  showAutocomplete.value = true;
                  autocompleteIndex.value = -1;
                  // Clear selection if user changes input
                  if (selectedProduct.value) {
                    const expected = `${selectedProduct.value.name} (${selectedProduct.value.vendorShortName} - ${selectedProduct.value.vendorLocationName})`;
                    if (materialInput.value !== expected) {
                      selectedProduct.value = null;
                      selectedRoute.value = null;
                      routeSearchInput.value = '';
                    }
                  }
                }}
                onFocus$={() => {
                  if (materialInput.value) {
                    showAutocomplete.value = true;
                  }
                }}
                onBlur$={() => {
                  // Delay to allow click on autocomplete item
                  setTimeout(() => {
                    showAutocomplete.value = false;
                  }, 200);
                }}
                onKeyDown$={handleKeyDown}
                placeholder="Start typing to search..."
                class="w-full"
                autocomplete="off"
              />

              {/* Autocomplete Dropdown */}
              {showAutocomplete.value && filteredProducts.value.length > 0 && (
                <div
                  class="absolute z-10 w-full mt-1 border rounded-lg overflow-hidden shadow-lg"
                  style="background-color: rgb(var(--color-surface)); border-color: rgb(var(--color-border)); max-height: 300px; overflow-y: auto;"
                >
                  {filteredProducts.value.map((product, index) => (
                    <div
                      key={product.id}
                      class="px-4 py-2 cursor-pointer transition-colors"
                      style={{
                        backgroundColor:
                          index === autocompleteIndex.value
                            ? 'rgb(var(--color-surface-hover))'
                            : 'transparent',
                      }}
                      onClick$={() => selectProduct(product)}
                      onMouseEnter$={() => {
                        autocompleteIndex.value = index;
                      }}
                    >
                      <div
                        class="font-medium"
                        style="color: rgb(var(--color-text-primary))"
                      >
                        {product.name}
                      </div>
                      <div
                        class="text-sm"
                        style="color: rgb(var(--color-text-secondary))"
                      >
                        {product.vendorShortName} - {product.vendorLocationName}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Driver Selector */}
            <div>
              <label
                for="driver"
                class="block text-sm font-medium mb-2"
                style="color: rgb(var(--color-text-secondary))"
              >
                Driver (Optional)
              </label>
              <select
                id="driver"
                value={selectedDriver.value?.id || ''}
                onChange$={(_, el) => {
                  const driverId = parseInt(el.value) || null;
                  selectedDriver.value = driverId
                    ? drivers.value.find((d) => d.id === driverId) || null
                    : null;
                }}
                class="w-full"
              >
                <option value="">Select a driver...</option>
                {drivers.value.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.firstName} {driver.lastName}{' '}
                    {driver.defaultTruck
                      ? `(Truck ${driver.defaultTruck})`
                      : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <div>
              <label
                for="date"
                class="block text-sm font-medium mb-2"
                style="color: rgb(var(--color-text-secondary))"
              >
                Ticket Date
              </label>
              <input
                id="date"
                type="date"
                value={selectedDate.value}
                onInput$={(e) => {
                  selectedDate.value = (e.target as HTMLInputElement).value;
                }}
                class="w-full"
              />
            </div>

            {/* Freight Route Dropdown with Search */}
            {selectedProduct.value && (
              <div class="relative">
                <div class="flex items-center justify-between mb-2">
                  <label
                    for="freightRoute"
                    class="block text-sm font-medium"
                    style="color: rgb(var(--color-text-secondary))"
                  >
                    Freight Route
                  </label>
                  <button
                    type="button"
                    class="text-sm"
                    style="color: rgb(var(--color-primary))"
                    onClick$={() => navigateToNewRoute(false)}
                  >
                    + Route
                  </button>
                </div>
                <input
                  id="freightRoute"
                  type="text"
                  value={routeSearchInput.value}
                  onInput$={(e) => {
                    routeSearchInput.value = (
                      e.target as HTMLInputElement
                    ).value;
                    showRouteAutocomplete.value = true;
                    routeAutocompleteIndex.value = -1;
                  }}
                  onFocus$={(e) => {
                    // Clear search to show all routes when focusing
                    routeSearchInput.value = '';
                    showRouteAutocomplete.value = true;
                    // Select all text for easy clearing
                    (e.target as HTMLInputElement).select();
                  }}
                  onBlur$={() => {
                    // Delay to allow click on autocomplete item
                    setTimeout(() => {
                      // Restore the selected route's destination if nothing was selected
                      if (selectedRoute.value && !showRouteAutocomplete.value) {
                        routeSearchInput.value =
                          selectedRoute.value.destination;
                      }
                      showRouteAutocomplete.value = false;
                    }, 200);
                  }}
                  onKeyDown$={handleRouteKeyDown}
                  placeholder="Search routes..."
                  class="w-full"
                  autocomplete="off"
                />

                {/* Route Autocomplete Dropdown */}
                {showRouteAutocomplete.value &&
                  filteredRoutes.value.length > 0 && (
                    <div
                      class="absolute z-10 w-full mt-1 border rounded-lg overflow-hidden shadow-lg"
                      style="background-color: rgb(var(--color-surface)); border-color: rgb(var(--color-border)); max-height: 200px; overflow-y: auto;"
                    >
                      {filteredRoutes.value.map((route, index) => (
                        <div
                          key={route.isDummy ? 'dummy' : route.id}
                          class="px-4 py-2 cursor-pointer transition-colors"
                          style={{
                            backgroundColor:
                              index === routeAutocompleteIndex.value
                                ? 'rgb(var(--color-surface-hover))'
                                : 'transparent',
                          }}
                          onClick$={() => selectRoute(route)}
                          onMouseEnter$={() => {
                            routeAutocompleteIndex.value = index;
                          }}
                        >
                          <div
                            class="font-medium"
                            style={{
                              color: route.isDummy
                                ? 'rgb(var(--color-text-secondary))'
                                : 'rgb(var(--color-text-primary))',
                            }}
                          >
                            {route.destination}
                            {route.isDummy && ' (not created yet)'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                {/* Warning if C&H Yard route doesn't exist */}
                {isCHYardMissing.value && (
                  <div
                    class="mt-2 text-sm"
                    style="color: rgb(var(--color-danger))"
                  >
                    C&H Yard route doesn't exist yet.{' '}
                    <button
                      type="button"
                      class="underline"
                      style="color: rgb(var(--color-primary))"
                      onClick$={() => navigateToNewRoute(true)}
                    >
                      Create it now
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Cost Per Ton (Read-only) */}
            <div>
              <label
                for="costPerTon"
                class="block text-sm font-medium mb-2"
                style="color: rgb(var(--color-text-secondary))"
              >
                Cost Per Ton (w FSC)
              </label>
              <input
                id="costPerTon"
                type="text"
                value={formatCurrency(costPerTon.value)}
                readOnly
                class="w-full"
                style="background-color: rgb(var(--color-bg-secondary)) !important; cursor: not-allowed;"
              />
            </div>

            {/* Total Cost (Read-only) */}
            <div>
              <label
                for="totalCost"
                class="block text-sm font-medium mb-2"
                style="color: rgb(var(--color-text-secondary))"
              >
                Total Cost (w FSC)
              </label>
              <input
                id="totalCost"
                type="text"
                value={formatCurrency(totalCost.value)}
                readOnly
                class="w-full"
                style="background-color: rgb(var(--color-bg-secondary)) !important; cursor: not-allowed;"
              />
            </div>

            {/* Print Buttons */}
            <div class="flex gap-3">
              <button
                class="btn btn-primary flex-1"
                onClick$={handlePrint}
                disabled={
                  !selectedProduct.value ||
                  !selectedRoute.value ||
                  selectedRoute.value.isDummy ||
                  tons.value <= 0
                }
              >
                <PrintIcon size={18} />
                Print Stub
              </button>
              <button
                class="btn btn-secondary flex-1"
                onClick$={() => window.print()}
                disabled={
                  !selectedProduct.value ||
                  !selectedRoute.value ||
                  selectedRoute.value.isDummy ||
                  tons.value <= 0
                }
              >
                <PrintIcon size={18} />
                Print
              </button>
            </div>
          </div>

          {/* Right Column - Breakdown */}
          <div class="card space-y-4">
            <h2 class="card-title">Breakdown</h2>

            {selectedProduct.value &&
            selectedRoute.value &&
            !selectedRoute.value.isDummy ? (
              <>
                {/* Title Area */}
                <div
                  class="text-center pb-4 border-b"
                  style="border-color: rgb(var(--color-border))"
                >
                  <h3
                    class="text-xl font-semibold"
                    style="color: rgb(var(--color-text-primary))"
                  >
                    {selectedProduct.value.name}
                  </h3>
                  <p
                    class="text-sm mt-1"
                    style="color: rgb(var(--color-text-secondary))"
                  >
                    {selectedProduct.value.vendorName} -{' '}
                    {selectedProduct.value.vendorLocationName}
                  </p>
                  <p
                    class="text-sm mt-1"
                    style="color: rgb(var(--color-text-secondary))"
                  >
                    Route: {selectedRoute.value.destination}
                  </p>
                </div>

                {/* Breakdown Table */}
                <div class="space-y-3">
                  {/* Product Cost */}
                  <div class="flex justify-between">
                    <span style="color: rgb(var(--color-text-secondary))">
                      Product
                    </span>
                    <span style="color: rgb(var(--color-text-primary))">
                      {formatCurrency(selectedProduct.value.productCost)} / T
                    </span>
                  </div>

                  {/* Freight Cost */}
                  <div class="flex justify-between">
                    <span style="color: rgb(var(--color-text-secondary))">
                      Freight
                    </span>
                    <span style="color: rgb(var(--color-text-primary))">
                      {formatCurrency(selectedRoute.value.freightCost)} / T
                    </span>
                  </div>

                  {/* Spacing */}
                  <div class="py-2"></div>

                  {/* CHT Fuel Surcharge */}
                  <div class="flex justify-between">
                    <span style="color: rgb(var(--color-text-secondary))">
                      CHT Fuel Surcharge
                    </span>
                    <span style="color: rgb(var(--color-text-primary))">
                      {formatCurrency(selectedProduct.value.chtFuelSurcharge)} /
                      T ({formatCurrency(chtFuelSurchargeTotal.value)})
                    </span>
                  </div>

                  {/* Tons */}
                  <div class="flex justify-between">
                    <span style="color: rgb(var(--color-text-secondary))">
                      Tons
                    </span>
                    <span style="color: rgb(var(--color-text-primary))">
                      {formatNumber(tons.value)} Tons
                    </span>
                  </div>

                  {/* Cost Per Ton */}
                  <div class="flex justify-between">
                    <span style="color: rgb(var(--color-text-secondary))">
                      Cost Per Ton (w FSC)
                    </span>
                    <span style="color: rgb(var(--color-text-primary))">
                      {formatCurrency(costPerTon.value)} / T
                    </span>
                  </div>

                  {/* Quantity in Yards */}
                  <div class="flex justify-between">
                    <span style="color: rgb(var(--color-text-secondary))">
                      Qty (yds)
                    </span>
                    <span style="color: rgb(var(--color-text-primary))">
                      {formatNumber(quantityYards.value)} cu yds
                    </span>
                  </div>

                  {/* Cost Per Yard */}
                  <div class="flex justify-between">
                    <span style="color: rgb(var(--color-text-secondary))">
                      Cost Per Yard
                    </span>
                    <span style="color: rgb(var(--color-text-primary))">
                      {formatCurrency(costPerYard.value)} / yd
                    </span>
                  </div>

                  {/* Spacing */}
                  <div class="py-2"></div>

                  {/* Total Cost */}
                  <div
                    class="flex justify-between pt-3 border-t"
                    style="border-color: rgb(var(--color-border))"
                  >
                    <span
                      class="font-semibold"
                      style="color: rgb(var(--color-text-primary))"
                    >
                      Total Cost (w FSC)
                    </span>
                    <span
                      class="font-semibold text-lg"
                      style="color: rgb(var(--color-primary))"
                    >
                      {formatCurrency(totalCost.value)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div class="text-center py-12">
                <p style="color: rgb(var(--color-text-secondary))">
                  {selectedProduct.value && isCHYardMissing.value
                    ? 'Please create or select a valid freight route'
                    : 'Select a material and route to view breakdown'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style>
        {`
          @media print {
            /* Hide navigation, buttons, and other UI elements */
            nav,
            a[href],
            button,
            .no-print {
              display: none !important;
            }

            /* Reset page styling for print */
            body {
              background: white !important;
              color: black !important;
              zoom: 95%;
            }

            section {
              padding: 0 !important;
              margin: 0 !important;
            }

            /* Force grid to stay side-by-side */
            .grid {
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              gap: 1rem !important;
            }

            /* Ensure cards are visible and styled for print */
            .card {
              break-inside: avoid;
              page-break-inside: avoid;
              border: 1px solid #333 !important;
              background: white !important;
              padding: 0.75rem !important;
              margin: 0 !important;
            }

            /* Make title smaller */
            .card-title,
            h2 {
              font-size: 1rem !important;
              margin-bottom: 0.5rem !important;
            }

            /* Reduce spacing in cards */
            .space-y-4 > * + * {
              margin-top: 0.5rem !important;
            }

            /* Make inputs and text smaller */
            input,
            label {
              font-size: 0.85rem !important;
            }

            label {
              margin-bottom: 0.25rem !important;
              font-weight: bold !important;
            }

            /* Ensure text is readable */
            *,
            span,
            div,
            p,
            label,
            h1,
            h2,
            h3 {
              color: #000 !important;
            }

            /* Keep input values visible */
            input {
              border: 1px solid #ccc !important;
              padding: 0.25rem !important;
              color: #000 !important;
              -webkit-text-fill-color: #000 !important;
            }

            input[readonly] {
              background: #f5f5f5 !important;
              color: #000 !important;
              -webkit-text-fill-color: #000 !important;
            }

            /* Reduce page margins */
            @page {
              margin: 0.4in;
              size: letter;
            }

            /* Make page title smaller */
            h1 {
              font-size: 1.25rem !important;
              margin-bottom: 0.5rem !important;
            }
          }
        `}
      </style>
    </section>
  );
});
