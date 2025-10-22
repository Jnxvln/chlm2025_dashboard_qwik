import {
  $,
  component$,
  useComputed$,
  useSignal,
  useVisibleTask$,
} from '@builder.io/qwik';
import {
  routeLoader$,
  routeAction$,
  useNavigate,
  useLocation,
  Form,
  zod$,
  z,
} from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { normalizeFormData } from '~/lib/text-utils';
import { validateDestinationNotYard } from '~/lib/validation';
import PageSubtitle from '~/components/PageSubtitle';
import BackButton from '~/components/BackButton';

export const useEditFreightRouteLoader = routeLoader$(async (event) => {
  const id = parseInt(event.params.id);

  const freightRoute = await db.freightRoute.findUnique({
    where: { id },
    include: {
      vendorLocation: {
        include: {
          vendor: true,
        },
      },
    },
  });

  if (!freightRoute) {
    throw event.error(404, 'Freight route not found');
  }

  // Get all active vendors
  const activeVendors = await db.vendor.findMany({
    where: { isActive: true },
    include: {
      vendorLocations: {
        where: { isActive: true },
        orderBy: [{ name: 'asc' }],
      },
    },
    orderBy: [{ name: 'asc' }],
  });

  // If freight route has an inactive vendor or location, include them as well
  const currentVendorId = freightRoute.vendorLocation.vendor.id;

  const currentVendor = await db.vendor.findUnique({
    where: { id: currentVendorId },
    include: {
      vendorLocations: true,
    },
  });

  // Add current vendor if it's not already in the list
  if (currentVendor && !activeVendors.find(v => v.id === currentVendor.id)) {
    activeVendors.push(currentVendor);
  }

  return {
    freightRoute,
    vendors: activeVendors,
  };
});

export const useUpdateFreightRoute = routeAction$(
  async (values, event) => {
    const id = parseInt(event.params.id);

    // Normalize capitalization before saving (notes, destination, and checkbox fields are preserved)
    const normalized = normalizeFormData(values, {
      skipFields: ['notes', 'destination', 'toYard', 'isActive'], // Preserve destination and checkbox values
    });

    const toYard = normalized.toYard === 'on';

    // Server-side validation: prevent manual "C&H Yard" entries
    const validation = validateDestinationNotYard(normalized.destination, toYard);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    await db.freightRoute.update({
      where: { id },
      data: {
        destination: toYard ? 'C&H Yard' : normalized.destination,
        freightCost: parseFloat(normalized.freightCost),
        toYard,
        isActive: normalized.isActive === 'on',
        notes: normalized.notes || null,
        vendorLocationId: parseInt(normalized.vendorLocationId),
      },
    });

    return {
      success: true,
      id,
    };
  },
  zod$({
    destination: z.string().min(2),
    freightCost: z
      .string()
      .min(1)
      .refine((val) => !isNaN(parseFloat(val)), {
        message: 'Must be a number',
      }),
    toYard: z.string().optional(),
    isActive: z.string().optional(),
    vendorLocationId: z.string().min(1),
    notes: z.string().optional(),
  }),
);

export default component$(() => {
  const data = useEditFreightRouteLoader();
  const action = useUpdateFreightRoute();
  const nav = useNavigate();
  const loc = useLocation();

  const selectedVendorId = useSignal<string | null>(null);
  const selectedLocationId = useSignal<string | null>(null);
  const toYard = useSignal<boolean>(false);
  const destination = useSignal<string>('');
  const destinationError = useSignal<string>('');
  const existingYardRoute = useSignal<{
    id: number;
    destination: string;
    vendorLocation: {
      name: string;
      vendor: { name: string };
    };
  } | null>(null);
  const checkingYardRoute = useSignal<boolean>(false);

  // Default vendor selection and toYard state based on existing route
  useVisibleTask$(() => {
    selectedVendorId.value =
      data.value.freightRoute.vendorLocation.vendor.id.toString();
    selectedLocationId.value = data.value.freightRoute.vendorLocationId.toString();
    toYard.value = data.value.freightRoute.toYard;
    destination.value = data.value.freightRoute.destination;
  });

  // Check for existing yard route when location changes (excluding current route)
  const checkForYardRoute = $(async (locationId: string) => {
    if (!locationId) {
      existingYardRoute.value = null;
      return;
    }

    checkingYardRoute.value = true;
    try {
      const currentRouteId = loc.params.id;
      const response = await fetch(`/api/check-yard-route?locationId=${locationId}&excludeRouteId=${currentRouteId}`);
      const data = await response.json();

      if (data.exists) {
        existingYardRoute.value = data.route;
        // If a yard route exists, uncheck toYard checkbox
        if (toYard.value) {
          toYard.value = false;
        }
      } else {
        existingYardRoute.value = null;
      }
    } catch (error) {
      console.error('Error checking for yard route:', error);
    } finally {
      checkingYardRoute.value = false;
    }
  });

  // Return to routes listing after submission
  useVisibleTask$(({ track }) => {
    const result = track(() => action.value);
    if (result?.success) {
      const returnTo = loc.url.searchParams.get('returnTo') || `/vendors/routes?highlight=${loc.params.id}`;
      setTimeout(() => nav(returnTo), 1000);
    }
  });

  // Filter locations based on selected vendor
  const filteredLocations = useComputed$(() => {
    const vendor = data.value.vendors.find(
      (v) => v.id.toString() === selectedVendorId.value,
    );
    return vendor?.vendorLocations ?? [];
  });

  const route = data.value.freightRoute;

  return (
    <section>
      <PageSubtitle text="Edit Freight Route" />
      <div class="my-3">
        <BackButton />
      </div>

      <div class="card max-w-lg">
        <Form
          action={action}
          class="space-y-4"
        >
        {route.deactivatedByParent && (
          <div class="p-4 rounded-lg mb-4" style="background-color: rgb(var(--color-warning) / 0.1); border: 1px solid rgb(var(--color-warning) / 0.3);">
            <p class="text-sm" style="color: rgb(var(--color-text-primary))">
              <strong>Note:</strong> This freight route was deactivated because its parent vendor or location was deactivated.
              The vendor and location cannot be changed while in this state.
              Reactivate the parent vendor first, or mark this route as active to enable editing.
            </p>
          </div>
        )}

        {/* Vendor */}
        <div>
          <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Vendor</label>
          <select
            name="vendorId"
            required
            value={route.vendorLocation.vendor.id}
            class="w-full"
            disabled={route.deactivatedByParent}
            onChange$={(e) => {
              selectedVendorId.value = (e.target as HTMLSelectElement).value;
            }}
          >
            <option value="">Select a vendor</option>
            {data.value.vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {`${vendor.name}${!vendor.isActive ? ' (Inactive)' : ''}`}
              </option>
            ))}
          </select>
        </div>

        {/* Vendor Location */}
        <div>
          <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Vendor Location</label>
          <select
            name="vendorLocationId"
            required
            class="w-full"
            disabled={route.deactivatedByParent}
            onChange$={(e) => {
              const locationId = (e.target as HTMLSelectElement).value;
              selectedLocationId.value = locationId;
              checkForYardRoute(locationId);
            }}
          >
            <option value="">Select a location</option>
            {filteredLocations.value.map((loc) => (
              <option
                key={loc.id}
                value={loc.id}
                selected={loc.id === route.vendorLocation.id}
              >
                {`${loc.name}${!loc.isActive ? ' (Inactive)' : ''}`}
              </option>
            ))}
          </select>
        </div>

        {/* Destination */}
        <div>
          <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Destination</label>
          <input
            name="destination"
            type="text"
            value={toYard.value ? 'C&H Yard' : destination.value}
            onInput$={(e) => {
              if (!toYard.value) {
                const value = (e.target as HTMLInputElement).value;
                destination.value = value;

                // Real-time validation
                const validation = validateDestinationNotYard(value, false);
                destinationError.value = validation.error || '';
              }
            }}
            readOnly={toYard.value}
            class="w-full"
            style={toYard.value ? "background-color: rgb(var(--color-bg-secondary)) !important; cursor: not-allowed;" : ""}
          />
          {destinationError.value && (
            <p class="text-sm mt-1" style="color: rgb(var(--color-error))">
              {destinationError.value}
            </p>
          )}
        </div>

        {/* Freight Cost */}
        <div>
          <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Freight Cost (per ton)</label>
          <input
            name="freightCost"
            type="number"
            step="0.01"
            value={route.freightCost}
            class="w-full"
          />
        </div>

        {/* Notes */}
        <div>
          <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Notes</label>
          <textarea
            name="notes"
            rows={4}
            class="w-full"
          >{route.notes ?? ''}</textarea>
        </div>

        {/* Existing Yard Route Warning */}
        {existingYardRoute.value && (
          <div class="p-3 rounded-lg" style="background-color: rgb(var(--color-warning) / 0.1); border: 1px solid rgb(var(--color-warning) / 0.3);">
            <p class="text-sm mb-2" style="color: rgb(var(--color-text-primary))">
              <strong>Note:</strong> A yard route already exists for this location:
            </p>
            <p class="text-sm mb-2" style="color: rgb(var(--color-text-secondary))">
              "{existingYardRoute.value.destination}" (Route #{existingYardRoute.value.id})
            </p>
            <a
              href={`/vendors/routes/${existingYardRoute.value.id}/edit`}
              class="text-sm underline"
              style="color: rgb(var(--color-accent))"
            >
              Edit existing yard route →
            </a>
          </div>
        )}

        {/* To Yard toggle */}
        <div class="flex items-center gap-2">
          <input
            name="toYard"
            type="checkbox"
            checked={toYard.value}
            disabled={!!existingYardRoute.value}
            onChange$={(e) => {
              toYard.value = (e.target as HTMLInputElement).checked;
              // Clear destination error when toYard is checked
              if (toYard.value) {
                destinationError.value = '';
              }
            }}
            style={existingYardRoute.value ? "opacity: 0.5; cursor: not-allowed;" : "accent-color: rgb(var(--color-primary))"}
          />
          <label class="text-sm font-medium" style={existingYardRoute.value ? "color: rgb(var(--color-text-secondary)); opacity: 0.7;" : "color: rgb(var(--color-text-primary))"}>
            To Yard (C&H Yard)
          </label>
        </div>

        {/* Active toggle */}
        <div class="flex items-center gap-2">
          <input name="isActive" type="checkbox" checked={route.isActive} style="accent-color: rgb(var(--color-primary))" />
          <label class="text-sm font-medium" style="color: rgb(var(--color-text-primary))">Active</label>
        </div>

        <div class="flex justify-end gap-3">
          <a href={loc.url.searchParams.get('returnTo') || '/vendors/routes'} class="btn btn-ghost">Cancel</a>
          <button
            type="submit"
            class="btn btn-primary"
            disabled={action.isRunning || !!destinationError.value}
          >
            {action.isRunning ? 'Updating...' : 'Update Freight Route'}
          </button>
        </div>
      </Form>
      </div>

      {action.value?.success && (
        <div class="mt-4 p-3 rounded-lg" style="background-color: rgb(var(--color-success) / 0.1); color: rgb(var(--color-success))">
          Route updated! Redirecting...
        </div>
      )}

      {action.value?.error && (
        <div class="mt-4 p-3 rounded-lg" style="background-color: rgb(var(--color-error) / 0.1); color: rgb(var(--color-error))">
          {action.value.error}
        </div>
      )}
    </section>
  );
});
