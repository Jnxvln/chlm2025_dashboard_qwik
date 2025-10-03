import {
  component$,
  useSignal,
  useComputed$,
  useVisibleTask$,
  $,
} from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import PageTitle from '~/components/PageTitle';
import { NavLink } from '~/components/NavLink';
import { PrintIcon } from '~/components/icons';

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
  freightRoute: {
    id: number;
    destination: string;
    freightCost: number;
    toYard: boolean;
  } | null;
}

export default component$(() => {
  const nav = useNavigate();

  // Signals for form inputs
  const tons = useSignal<number>(0);
  const materialInput = useSignal<string>('');
  const selectedProduct = useSignal<VendorProduct | null>(null);
  const showAutocomplete = useSignal<boolean>(false);
  const autocompleteIndex = useSignal<number>(-1);

  // Signals for data
  const allProducts = useSignal<VendorProduct[]>([]);
  const isLoading = useSignal<boolean>(true);

  // Computed values for autocomplete filtering
  const filteredProducts = useComputed$(() => {
    if (!materialInput.value) return [];
    const search = materialInput.value.toLowerCase();
    return allProducts.value.filter((product) => {
      const displayName = `${product.name} (${product.vendorShortName} - ${product.vendorLocationName})`.toLowerCase();
      return displayName.includes(search);
    });
  });

  // Computed calculations
  const costPerTon = useComputed$(() => {
    if (!selectedProduct.value || !selectedProduct.value.freightRoute) return 0;
    return (
      selectedProduct.value.productCost +
      selectedProduct.value.freightRoute.freightCost +
      selectedProduct.value.chtFuelSurcharge
    );
  });

  const totalCost = useComputed$(() => {
    return costPerTon.value * tons.value;
  });

  const quantityYards = useComputed$(() => {
    return tons.value / 1.35;
  });

  const costPerYard = useComputed$(() => {
    return costPerTon.value * 1.35;
  });

  const chtFuelSurchargeTotal = useComputed$(() => {
    if (!selectedProduct.value) return 0;
    return selectedProduct.value.chtFuelSurcharge * tons.value;
  });

  // Fetch vendor products on mount
  useVisibleTask$(async () => {
    try {
      const response = await fetch('/api/vendor-products-yard');
      const data = await response.json();
      if (data.success) {
        allProducts.value = data.products;
      }
    } catch (error) {
      console.error('Failed to fetch vendor products:', error);
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
  });

  // Handle print button
  const handlePrint = $(async () => {
    if (!selectedProduct.value || !selectedProduct.value.freightRoute) {
      alert('Please select a material first');
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
      tons: tons.value,
      product: selectedProduct.value.productCost,
      freightToYard: selectedProduct.value.freightRoute.freightCost,
      chtFuelSurcharge: selectedProduct.value.chtFuelSurcharge,
      yards: quantityYards.value,
      costPerYard: costPerYard.value,
      costPerTon: costPerTon.value,
      totalCostTons: totalCost.value,
    };

    const params = new URLSearchParams({
      breakdownData: JSON.stringify(breakdownData),
    });

    await nav(`/calculators/cost/print?${params.toString()}`);
  });

  // Handle keyboard navigation for autocomplete
  const handleKeyDown = $((event: KeyboardEvent) => {
    if (!showAutocomplete.value || filteredProducts.value.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      autocompleteIndex.value = Math.min(
        autocompleteIndex.value + 1,
        filteredProducts.value.length - 1
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
                  tons.value = parseFloat((e.target as HTMLInputElement).value) || 0;
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
                      <div class="font-medium" style="color: rgb(var(--color-text-primary))">
                        {product.name}
                      </div>
                      <div class="text-sm" style="color: rgb(var(--color-text-secondary))">
                        {product.vendorShortName} - {product.vendorLocationName}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

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

            {/* Print Button */}
            <button
              class="btn btn-primary w-full"
              onClick$={handlePrint}
              disabled={!selectedProduct.value || tons.value <= 0}
            >
              <PrintIcon size={18} />
              Print
            </button>
          </div>

          {/* Right Column - Breakdown */}
          <div class="card space-y-4">
            <h2 class="card-title">Breakdown</h2>

            {selectedProduct.value ? (
              <>
                {/* Title Area */}
                <div class="text-center pb-4 border-b" style="border-color: rgb(var(--color-border))">
                  <h3 class="text-xl font-semibold" style="color: rgb(var(--color-text-primary))">
                    {selectedProduct.value.name}
                  </h3>
                  <p class="text-sm mt-1" style="color: rgb(var(--color-text-secondary))">
                    {selectedProduct.value.vendorName} - {selectedProduct.value.vendorLocationName}
                  </p>
                </div>

                {/* Breakdown Table */}
                <div class="space-y-3">
                  {/* Product Cost */}
                  <div class="flex justify-between">
                    <span style="color: rgb(var(--color-text-secondary))">Product</span>
                    <span style="color: rgb(var(--color-text-primary))">
                      {formatCurrency(selectedProduct.value.productCost)} / T
                    </span>
                  </div>

                  {/* Freight Cost */}
                  <div class="flex justify-between">
                    <span style="color: rgb(var(--color-text-secondary))">Freight</span>
                    <span style="color: rgb(var(--color-text-primary))">
                      {selectedProduct.value.freightRoute
                        ? `${formatCurrency(selectedProduct.value.freightRoute.freightCost)} / T`
                        : 'N/A'}
                    </span>
                  </div>

                  {/* Spacing */}
                  <div class="py-2"></div>

                  {/* CHT Fuel Surcharge */}
                  <div class="flex justify-between">
                    <span style="color: rgb(var(--color-text-secondary))">CHT Fuel Surcharge</span>
                    <span style="color: rgb(var(--color-text-primary))">
                      {formatCurrency(selectedProduct.value.chtFuelSurcharge)} / T (
                      {formatCurrency(chtFuelSurchargeTotal.value)})
                    </span>
                  </div>

                  {/* Tons */}
                  <div class="flex justify-between">
                    <span style="color: rgb(var(--color-text-secondary))">Tons</span>
                    <span style="color: rgb(var(--color-text-primary))">
                      {formatNumber(tons.value)} Tons
                    </span>
                  </div>

                  {/* Cost Per Ton */}
                  <div class="flex justify-between">
                    <span style="color: rgb(var(--color-text-secondary))">Cost Per Ton (w FSC)</span>
                    <span style="color: rgb(var(--color-text-primary))">
                      {formatCurrency(costPerTon.value)} / T
                    </span>
                  </div>

                  {/* Quantity in Yards */}
                  <div class="flex justify-between">
                    <span style="color: rgb(var(--color-text-secondary))">Qty (yds)</span>
                    <span style="color: rgb(var(--color-text-primary))">
                      {formatNumber(quantityYards.value)} cu yds
                    </span>
                  </div>

                  {/* Cost Per Yard */}
                  <div class="flex justify-between">
                    <span style="color: rgb(var(--color-text-secondary))">Cost Per Yard</span>
                    <span style="color: rgb(var(--color-text-primary))">
                      {formatCurrency(costPerYard.value)} / yd
                    </span>
                  </div>

                  {/* Spacing */}
                  <div class="py-2"></div>

                  {/* Total Cost */}
                  <div class="flex justify-between pt-3 border-t" style="border-color: rgb(var(--color-border))">
                    <span class="font-semibold" style="color: rgb(var(--color-text-primary))">
                      Total Cost (w FSC)
                    </span>
                    <span class="font-semibold text-lg" style="color: rgb(var(--color-primary))">
                      {formatCurrency(totalCost.value)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div class="text-center py-12">
                <p style="color: rgb(var(--color-text-secondary))">
                  Select a material to view breakdown
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
});
