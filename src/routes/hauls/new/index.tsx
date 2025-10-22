import {
  component$,
  useSignal,
  useComputed$,
  useVisibleTask$,
  $,
} from '@builder.io/qwik';
import { Form, useNavigate, useLocation } from '@builder.io/qwik-city';

import { useNewHaulLoader } from './loader';
import { useNewHaulAction } from './action';

export { useNewHaulLoader } from './loader';
export { useNewHaulAction } from './action';

export default component$(() => {
  const data = useNewHaulLoader();
  const action = useNewHaulAction();
  const nav = useNavigate();
  const loc = useLocation();

  // Form state
  const selectedVendorId = useSignal<string | null>(null);
  const selectedLocationId = useSignal<string | null>(null);
  const selectedLoadType = useSignal<'enddump' | 'flatbed'>('enddump');
  const selectedRate = useSignal<string>('');
  const selectedQuantity = useSignal<string>('');
  const selectedDriverId = useSignal<string>(data.value.driverId?.toString() || '');
  const selectedDate = useSignal<string>('');
  const truckNumber = useSignal<string>('');

  // Workday state
  const workdayId = useSignal<number | null>(null);
  const workdayExists = useSignal<boolean | null>(null);
  const showWorkdayDialog = useSignal(false);
  const workdayDialogType = useSignal<'create' | 'existing' | null>(null);
  const workdayDialogData = useSignal<any>(null);

  const returnTo = (() => {
    const raw = loc.url.searchParams.get('returnTo') ?? '';
    return raw.startsWith('/') ? decodeURIComponent(raw) : '/hauls';
  })();

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

  // Dynamically filter vendor products
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

  // Initialize driver, truck, and handle preselected dates
  useVisibleTask$(() => {
    if (data.value.driverId) {
      const driver = data.value.drivers.find(d => d.id === data.value.driverId);
      if (driver?.defaultTruck) {
        truckNumber.value = driver.defaultTruck;
      }
      selectedDriverId.value = data.value.driverId.toString();
    }

    // Set the date from loader
    if (data.value.haulDate) {
      selectedDate.value = data.value.haulDate;
    }


    // Auto-proceed if we have a preselected date (from Add Haul/Create Haul buttons)
    if (data.value.hasPreselectedDate && selectedDate.value && selectedDriverId.value) {
      // Directly perform workday check without calling handleDateChange
      setTimeout(async () => {
        try {
          const response = await fetch(
            `/api/workday-check?driverId=${selectedDriverId.value}&date=${selectedDate.value}`
          );
          const result = await response.json();

          if (result.exists) {
            workdayExists.value = true;
            workdayId.value = result.workday.id;
            workdayDialogType.value = 'existing';
            workdayDialogData.value = result;
            showWorkdayDialog.value = true;
          } else {
            workdayExists.value = false;
            workdayId.value = null;
            workdayDialogType.value = 'create';
            workdayDialogData.value = result;
            showWorkdayDialog.value = true;
          }
        } catch (error) {
          console.error('NEW HAUL - Auto workday check failed:', error);
        }
      }, 100);
    }
  });

  // Handle date change - check for workday existence
  const handleDateChange = $(async (newDate: string) => {
    if (!newDate || !selectedDriverId.value) {
      workdayExists.value = null;
      workdayId.value = null;
      return;
    }

    try {
      const response = await fetch(
        `/api/workday-check?driverId=${selectedDriverId.value}&date=${newDate}`
      );
      const result = await response.json();

      if (result.exists) {
        // Workday exists - show confirmation to add to existing
        workdayExists.value = true;
        workdayId.value = result.workday.id;
        workdayDialogType.value = 'existing';
        workdayDialogData.value = result;
        showWorkdayDialog.value = true;
      } else {
        // No workday - show confirmation to create new
        workdayExists.value = false;
        workdayId.value = null;
        workdayDialogType.value = 'create';
        workdayDialogData.value = result;
        showWorkdayDialog.value = true;
      }
    } catch (error) {
      console.error('NEW HAUL - Workday check failed:', error);
      workdayExists.value = null;
      workdayId.value = null;
    }
  });

  // Handle workday confirmation
  const handleWorkdayConfirm = $(async (confirmed: boolean) => {
    if (!confirmed) {
      // User cancelled - clear date and hide dialog
      selectedDate.value = '';
      workdayExists.value = null;
      workdayId.value = null;
      showWorkdayDialog.value = false;
      return;
    }

    if (workdayDialogType.value === 'create') {
      // Set workdayId to 0 to signal action to create workday on save
      workdayId.value = 0;
      workdayExists.value = false;
      showWorkdayDialog.value = false;
    } else {
      // Use existing workday
      workdayId.value = workdayDialogData.value.workday.id;
      showWorkdayDialog.value = false;
    }
  });

  // Handle form submission success
  useVisibleTask$(({ track }) => {
    const result = track(() => action.value);
    if (result?.success && result?.haulId && result?.workdayId) {
      setTimeout(() => {
        const redirectUrl = result.returnTo || returnTo;
        const urlObj = new URL(redirectUrl, window.location.origin);
        urlObj.searchParams.set('workdayId', result.workdayId.toString());
        urlObj.searchParams.set('haulId', result.haulId.toString());
        nav(urlObj.pathname + urlObj.search);
      }, 1000);
    }
  });

  // Show workday confirmation dialog
  if (showWorkdayDialog.value && workdayDialogData.value) {
    const isCreate = workdayDialogType.value === 'create';
    const driver = workdayDialogData.value.driver;
    const workday = workdayDialogData.value.workday;
    // Parse date safely - HTML date input gives YYYY-MM-DD format
    const [year, month, day] = selectedDate.value.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day); // month is 0-indexed in JS
    const dateStr = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return (
      <div class="p-6 max-w-2xl mx-auto">
        <div class="card text-center">
          <div class="mb-6">
            <h2 class="text-xl font-bold mb-4">
              {isCreate ? 'No Workday Found' : 'Workday Exists'}
            </h2>

            {isCreate ? (
              <div>
                <p class="mb-4" style="color: rgb(var(--color-text-secondary))">
                  No workday exists for <strong>{driver?.firstName} {driver?.lastName}</strong> on <strong>{dateStr}</strong>.
                </p>
                <p style="color: rgb(var(--color-text-secondary))">
                  A new workday will be created when you save this haul. The workday will have 0 hours that you can edit later.
                </p>
              </div>
            ) : (
              <div>
                <p class="mb-4" style="color: rgb(var(--color-text-secondary))">
                  A workday already exists for <strong>{driver?.firstName} {driver?.lastName}</strong> on <strong>{dateStr}</strong>.
                </p>
                <p class="mb-4" style="color: rgb(var(--color-text-secondary))">
                  <strong>CH Hours:</strong> {workday?.chHours} | <strong>NC Hours:</strong> {workday?.ncHours}
                </p>
                <p style="color: rgb(var(--color-text-secondary))">
                  Would you like to add this haul to the existing workday?
                </p>
              </div>
            )}
          </div>

          <div class="flex justify-center gap-4">
            <button
              class="btn btn-ghost"
              onClick$={() => handleWorkdayConfirm(false)}
            >
              Cancel
            </button>
            <button
              class="btn btn-primary"
              onClick$={() => handleWorkdayConfirm(true)}
            >
              {isCreate ? 'Continue' : 'Add to Existing Workday'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Format date as MM/DD/YY
  const formatDateMMDDYY = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${month}/${day}/${year.substring(2)}`;
  };

  return (
    <div class="p-6 max-w-3xl mx-auto">
      {/* Show title with date if workday confirmed */}
      {workdayId.value !== null && selectedDate.value && (
        <div class="mb-6">
          <h1 class="text-2xl font-bold" style="color: rgb(var(--color-text-primary))">
            New Haul
          </h1>
          <p class="text-sm mt-1" style="color: rgb(var(--color-text-secondary))">
            Haul Date: {formatDateMMDDYY(selectedDate.value)}
          </p>
        </div>
      )}

      <div class="card">
        <Form action={action} class="space-y-4">
          <input type="hidden" name="workdayId" value={workdayId.value || 0} />
          <input type="hidden" name="driverId" value={selectedDriverId.value} />
          <input type="hidden" name="createdById" value={data.value.createdById} />
          <input type="hidden" name="returnTo" value={returnTo} />

          {/* Step 1: Date Selection - Show only if no workday confirmed yet AND no preselected date */}
          {workdayId.value === null && !data.value.hasPreselectedDate && (
            <>
              <div>
                <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">
                  Haul Date *
                </label>
                <input
                  type="date"
                  value={selectedDate.value}
                  required
                  class="w-full"
                  onInput$={(_, el) => {
                    selectedDate.value = el.value;
                  }}
                />
                <p class="text-sm mt-1" style="color: rgb(var(--color-text-tertiary))">
                  Select the date for this haul
                </p>
              </div>

              <div class="flex justify-end items-center mt-4">
                <div class="flex gap-4">
                  <a href={returnTo} class="btn btn-ghost">Cancel</a>
                  <button
                    type="button"
                    class="btn btn-primary"
                    disabled={!selectedDate.value}
                    onClick$={() => {
                      if (selectedDate.value) {
                        handleDateChange(selectedDate.value);
                      }
                    }}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Loading state for preselected dates */}
          {workdayId.value === null && data.value.hasPreselectedDate && (
            <div class="text-center py-8">
              <p class="text-lg" style="color: rgb(var(--color-text-secondary))">
                Checking workday for {selectedDate.value}...
              </p>
            </div>
          )}

          {/* Hidden field for form submission */}
          <input type="hidden" name="dateHaul" value={selectedDate.value} />

          {/* Show form only after workday is confirmed */}
          {workdayId.value !== null && (
            <>
              {/* Load Time - First field */}
              <div>
                <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">
                  Load Time *
                </label>
                <input
                  name="loadTime"
                  type="time"
                  class="w-full"
                  required
                  value="08:00"
                />
                <p class="text-xs mt-1" style="color: rgb(var(--color-text-tertiary))">
                  Time when driver loaded at the quarry
                </p>
              </div>

              {/* Row 2: Driver, Load Type, Truck # */}
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">
                    Driver *
                  </label>
                  <select
                    name="driverId"
                    class="w-full"
                    required
                    value={selectedDriverId.value}
                    onChange$={(_, el) => {
                      selectedDriverId.value = el.value;
                      const driver = data.value.drivers.find(d => d.id.toString() === el.value);
                      if (driver?.defaultTruck) {
                        truckNumber.value = driver.defaultTruck;
                      } else {
                        truckNumber.value = '';
                      }
                    }}
                  >
                    <option value="">Select Driver</option>
                    {data.value.drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {`${driver.firstName} ${driver.lastName}${driver.defaultTruck ? ` (${driver.defaultTruck})` : ''}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">
                    Load Type *
                  </label>
                  <select
                    name="loadType"
                    class="w-full"
                    required
                    value={selectedLoadType.value}
                    onChange$={(_, el) => {
                      selectedLoadType.value = el.value as 'enddump' | 'flatbed';
                      // Clear rate when switching load types
                      selectedRate.value = '';
                    }}
                  >
                    <option value="enddump">End Dump</option>
                    <option value="flatbed">Flat Bed</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">
                    Truck # *
                  </label>
                  <input
                    name="truck"
                    class="w-full"
                    required
                    value={truckNumber.value}
                    onInput$={(_, el) => {
                      truckNumber.value = el.value;
                    }}
                  />
                </div>
              </div>

              {/* Rest of the form... */}
              <div class={selectedLoadType.value === 'flatbed' ? "grid grid-cols-3 gap-4" : "grid grid-cols-2 gap-4"}>
                <div>
                  <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Customer</label>
                  <input
                    name="customer"
                    type="text"
                    class="w-full"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Load/Ref #</label>
                  <input
                    name="loadRefNum"
                    type="text"
                    class="w-full"
                  />
                </div>
                {selectedLoadType.value === 'flatbed' && (
                  <div>
                    <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">CH Invoice #</label>
                    <input name="chInvoice" type="text" class="w-full" />
                  </div>
                )}
              </div>

              {/* Conditional fields based on load type */}
              {selectedLoadType.value === 'enddump' ? (
                <>
                  {/* End Dump: Vendor, Location, Route */}
                  <div class="grid grid-cols-3 gap-4">
                    <div>
                      <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">From (Vendor) *</label>
                      <select
                        name="vendorId"
                        class="w-full"
                        required
                        onChange$={(_, el) => {
                          selectedVendorId.value = el.value;
                          selectedLocationId.value = null;
                        }}
                      >
                        <option value="">Select Vendor</option>
                        {data.value.vendors.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Location *</label>
                      <select
                        name="vendorLocationId"
                        class="w-full"
                        required
                        onChange$={(_, el) => {
                          selectedLocationId.value = el.value;
                        }}
                      >
                        <option value="">Select Location</option>
                        {filteredLocations.value.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">To (Route) *</label>
                      <select
                        name="freightRouteId"
                        class="w-full"
                        required
                        onChange$={(_, el) => {
                          const fr = data.value.freightRoutes.find(
                            (r) => r.id.toString() === el.value,
                          );
                          if (fr) selectedRate.value = fr.freightCost.toFixed(2);
                        }}
                      >
                        <option value="">Select Route</option>
                        {filteredRoutes.value.map((fr) => (
                          <option key={fr.id} value={fr.id}>
                            {fr.destination}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* End Dump: Material */}
                  <div>
                    <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Material *</label>
                    <select
                      name="vendorProductId"
                      required
                      class="w-full"
                      disabled={!selectedVendorId.value || !selectedLocationId.value}
                    >
                      <option value="">Select Material</option>
                      {filteredProducts.value.map((vp) => (
                        <option key={vp.id} value={vp.id}>
                          {vp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  {/* Flatbed: From and To text inputs */}
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">From *</label>
                      <input
                        name="flatbedFrom"
                        type="text"
                        class="w-full"
                        required
                        placeholder="City, ST"
                      />
                    </div>

                    <div>
                      <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">To *</label>
                      <input
                        name="flatbedTo"
                        type="text"
                        class="w-full"
                        required
                        placeholder="City, ST"
                      />
                    </div>
                  </div>

                  {/* Flatbed: Material text input */}
                  <div>
                    <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Material *</label>
                    <input
                      name="flatbedMaterial"
                      type="text"
                      class="w-full"
                      required
                      placeholder="Material description"
                    />
                  </div>
                </>
              )}

              {/* Rate Metric, Quantity, Rate */}
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Rate Metric *</label>
                  <select name="rateMetric" class="w-full" required>
                    <option value="ton">Tons</option>
                    <option value="mile">Miles</option>
                    <option value="hour">Hours</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Quantity *</label>
                  <input
                    name="quantity"
                    type="number"
                    step="0.01"
                    class="w-full"
                    required
                    value={selectedQuantity.value}
                    onInput$={(_, el) => {
                      selectedQuantity.value = el.value;
                    }}
                    onBlur$={(_, el) => {
                      const num = parseFloat(el.value);
                      if (!isNaN(num)) {
                        selectedQuantity.value = num.toFixed(2);
                      }
                    }}
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">
                    {selectedLoadType.value === 'flatbed' ? 'Pay Rate *' : 'Rate *'}
                  </label>
                  <input
                    name="rate"
                    type="number"
                    step="0.01"
                    class="w-full"
                    required
                    value={selectedRate.value}
                    onInput$={(_, el) => {
                      selectedRate.value = el.value;
                    }}
                    onBlur$={(_, el) => {
                      const num = parseFloat(el.value);
                      if (!isNaN(num)) {
                        selectedRate.value = num.toFixed(2);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div class="flex justify-end gap-4 mt-4">
                <a href={returnTo} class="btn btn-ghost">Cancel</a>
                <button
                  type="submit"
                  class="btn btn-primary"
                  disabled={action.isRunning}
                >
                  {action.isRunning ? 'Saving...' : 'Save Haul'}
                </button>
              </div>
            </>
          )}

          {/* Messages */}
          {action.value?.error && (
            <div class="p-3 rounded-lg" style="background-color: rgb(var(--color-danger) / 0.1); color: rgb(var(--color-danger))">
              {action.value.error}
            </div>
          )}
          {action.value?.success && (
            <div class="p-3 rounded-lg" style="background-color: rgb(var(--color-success) / 0.1); color: rgb(var(--color-success))">
              Haul created! Redirecting…
            </div>
          )}
        </Form>
      </div>
    </div>
  );
});