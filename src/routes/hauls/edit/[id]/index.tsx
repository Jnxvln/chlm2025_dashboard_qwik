import {
  component$,
  useSignal,
  useComputed$,
  useVisibleTask$,
} from '@builder.io/qwik';
import { Form, useNavigate, useLocation } from '@builder.io/qwik-city';

import { useEditHaulLoader } from './loader';
import { useEditHaulAction } from './action';

export { useEditHaulLoader } from './loader';
export { useEditHaulAction } from './action';

export default component$(() => {
  const data = useEditHaulLoader();
  const action = useEditHaulAction();
  const nav = useNavigate();
  const loc = useLocation();

  const selectedVendorId = useSignal<string | null>(null);
  const selectedLocationId = useSignal<string | null>(null);
  const selectedLoadType = useSignal<'enddump' | 'flatbed'>('enddump');
  const selectedRate = useSignal<number | null>(null);

  const raw = loc.url.searchParams.get('returnTo') ?? '';
  const returnTo = raw.startsWith('/') ? decodeURIComponent(raw) : '';

  // Extract params for fallback URL
  const driverParam = loc.url.searchParams.get('driver') || '';
  const startDateParam = loc.url.searchParams.get('startDate') || '';
  const endDateParam = loc.url.searchParams.get('endDate') || '';
  
  // Build fallback URL with filters
  const fallbackUrl = `/hauls?${new URLSearchParams({
    ...(driverParam && { driver: driverParam }),
    ...(startDateParam && { startDate: startDateParam }),
    ...(endDateParam && { endDate: endDateParam })
  }).toString()}`;

  // Initialize signals with loaded data
  useVisibleTask$(() => {
    if (data.value.haul) {
      selectedVendorId.value = data.value.haul.vendorProduct.vendorId.toString();
      selectedLocationId.value = data.value.haul.vendorProduct.vendorLocationId.toString();
      selectedLoadType.value = data.value.haul.loadType as 'enddump' | 'flatbed';
      selectedRate.value = data.value.haul.rate;
    }
  });

  // Dynamically filter vendor locations
  const filteredLocations = useComputed$(() => {
    return (
      data.value?.vendors?.find(
        (v) => v.id.toString() === selectedVendorId.value,
      )?.vendorLocations ?? []
    );
  });

  // Dynamically filter freight routes
  const filteredRoutes = useComputed$(() => {
    return (
      data.value?.freightRoutes?.filter(
        (r) => r.vendorLocationId.toString() === selectedLocationId.value,
      ) ?? []
    );
  });

  // Dynamically filter vendor products based on selected vendor and location
  const filteredProducts = useComputed$(() => {
    const vendorId = selectedVendorId.value;
    const locationId = selectedLocationId.value;

    if (!vendorId || !locationId) return [];

    return data.value.vendorProducts.filter(
      (vp) =>
        vp.vendorId.toString() === vendorId &&
        vp.vendorLocationId.toString() === locationId,
    );
  });

  useVisibleTask$(({ track }) => {
    const result = track(() => action.value);
    if (result?.success) {
      setTimeout(() => {
        nav(result.returnTo || fallbackUrl);
      }, 1000);
    }
  });

  if (!data.value.haul) {
    return <div class="p-6">Haul not found</div>;
  }

  const haul = data.value.haul;

  return (
    <div class="p-6 max-w-3xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">Edit Haul</h1>
      
      <Form action={action} class="space-y-4">
        <input type="hidden" name="haulId" value={haul.id} />
        <input type="hidden" name="returnTo" value={returnTo} />

        {/* Row 1 */}
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Driver</label>
            <select name="driverId" class="input w-full" required>
              {Array.isArray(data.value?.drivers) &&
                data.value.drivers.map((v) => (
                  <option key={v.id} value={v.id} selected={v.id === haul.workday.driverId}>
                    {v.firstName} {v.lastName}{' '}
                    {v.defaultTruck ? `(${v.defaultTruck})` : ''}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Load Type</label>
            <select
              name="loadType"
              class="input w-full"
              required
              onChange$={(e) =>
                (selectedLoadType.value = e.target.value as
                  | 'enddump'
                  | 'flatbed')
              }
            >
              <option value="enddump" selected={haul.loadType === 'enddump'}>End Dump</option>
              <option value="flatbed" selected={haul.loadType === 'flatbed'}>Flat Bed</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Truck #</label>
            <input name="truck" class="input w-full" required value={haul.truck} />
          </div>
        </div>

        {/* Row 2 */}
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Haul Date</label>
            <input
              name="dateHaul"
              type="date"
              value={haul.dateHaul.toISOString().split('T')[0]}
              required
              class="input w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Customer</label>
            <input name="customer" type="text" class="input w-full" value={haul.customer || ''} />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Load/Ref #</label>
            <input name="loadRefNum" type="text" class="input w-full" value={haul.loadRefNum || ''} />
          </div>
        </div>

        {/* Row 3 */}
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">From (Vendor)</label>
            <select
              name="vendorId"
              class="input w-full"
              required
              onChange$={(e) => {
                selectedVendorId.value = e.target.value;
                selectedLocationId.value = null;
              }}
            >
              <option value="">Select Vendor</option>
              {Array.isArray(data.value?.vendors) &&
                data.value.vendors.map((v) => (
                  <option key={v.id} value={v.id} selected={v.id === haul.vendorProduct.vendorId}>
                    {v.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Location</label>
            <select
              name="vendorLocationId"
              class="input w-full"
              required
              onChange$={(e) => {
                selectedLocationId.value = e.target.value;
              }}
            >
              <option value="">Select Location</option>
              {Array.isArray(filteredLocations.value) &&
                filteredLocations.value.map((loc) => (
                  <option key={loc.id} value={loc.id} selected={loc.id === haul.vendorProduct.vendorLocationId}>
                    {loc.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">To (Route)</label>
            <select
              name="freightRouteId"
              class="input w-full"
              required
              onChange$={(e) => {
                const fr = data.value.freightRoutes.find(
                  (r) => r.id.toString() === e.target.value,
                );
                if (fr) selectedRate.value = fr.freightCost;
              }}
            >
              <option value="">Select Route</option>
              {filteredRoutes.value.map((fr) => (
                <option key={fr.id} value={fr.id} selected={fr.id === haul.freightRouteId}>
                  {fr.destination}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 4 */}
        <div>
          <label class="block text-sm font-medium mb-1">Material</label>
          <select
            name="vendorProductId"
            required
            class="input w-full"
            disabled={!selectedVendorId.value || !selectedLocationId.value}
          >
            <option value="">Select Material</option>
            {Array.isArray(filteredProducts.value) &&
              filteredProducts.value.map((vp) => (
                <option key={vp.id} value={vp.id} selected={vp.id === haul.vendorProductId}>
                  {vp.name}
                </option>
              ))}
          </select>
        </div>

        {/* Row 5 */}
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Rate Metric</label>
            <select name="rateMetric" class="input w-full" required>
              <option value="ton" selected={haul.rateMetric === 'ton'}>Tons</option>
              <option value="mile" selected={haul.rateMetric === 'mile'}>Miles</option>
              <option value="hour" selected={haul.rateMetric === 'hour'}>Hours</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Quantity</label>
            <input
              name="quantity"
              type="number"
              step="0.01"
              class="input w-full"
              required
              value={haul.quantity}
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Rate</label>
            <input
              name="rate"
              type="number"
              step="0.01"
              class="input w-full"
              required
              value={selectedRate.value ?? haul.rate}
            />
          </div>
        </div>

        {/* Conditionally show CH Invoice for flatbed */}
        {selectedLoadType.value === 'flatbed' && (
          <div>
            <label class="block text-sm font-medium mb-1">CH Invoice #</label>
            <input name="chInvoice" type="text" class="input w-full" value={haul.chInvoice || ''} />
          </div>
        )}

        {/* Buttons */}
        <div class="flex justify-end items-center mt-4">
          <div class="flex gap-4">
            <a
              href={returnTo || fallbackUrl}
              class="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </a>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Update Haul
            </button>
          </div>
        </div>

        {/* Messages */}
        {action.value?.error && (
          <div class="text-red-600">{action.value.error}</div>
        )}
        {action.value?.success && (
          <div class="text-green-600">Haul updated! Redirecting…</div>
        )}
      </Form>
    </div>
  );
});