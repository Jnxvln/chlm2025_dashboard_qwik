import {
  $,
  component$,
  useComputed$,
  useSignal,
  useVisibleTask$,
} from '@builder.io/qwik';
import {
  routeAction$,
  z,
  zod$,
  Form,
  routeLoader$,
  useNavigate,
  useLocation,
} from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { validateDestinationNotYard } from '~/lib/validation';
import PageSubtitle from '~/components/PageSubtitle';
import BackButton from '~/components/BackButton';

export const useVendorAndLocationsLoader = routeLoader$(async () => {
  const vendors = await db.vendor.findMany({
    where: { isActive: true },
    include: {
      vendorLocations: {
        where: { isActive: true },
        orderBy: [{ name: 'asc' }],
      },
    },
    orderBy: { name: 'asc' },
  });

  return vendors;
});

export const useCreateFreightRoute = routeAction$(
  async (values) => {
    const toYard = values.toYard === 'on';

    // Server-side validation: prevent manual "C&H Yard" entries
    const validation = validateDestinationNotYard(values.destination, toYard);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    const freightRoute = await db.freightRoute.create({
      data: {
        destination: toYard ? 'C&H Yard' : values.destination,
        freightCost: parseFloat(values.freightCost),
        toYard,
        isActive: values.isActive === 'on',
        vendorLocationId: parseInt(values.vendorLocationId),
      },
    });

    return {
      success: true,
      id: freightRoute.id,
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
    toYard: z.string().optional(), // checkbox
    isActive: z.string().optional(), // checkbox
    vendorLocationId: z.string().min(1),
  }),
);

export const useVendorLocationsLoader = routeLoader$(async () => {
  const vendorLocations = await db.vendorLocation.findMany({
    where: { isActive: true },
    orderBy: [{ name: 'asc' }],
  });

  return vendorLocations;
});

export default component$(() => {
  const vendors = useVendorAndLocationsLoader();
  const action = useCreateFreightRoute();
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

  const filteredLocations = useComputed$(() => {
    const vendor = vendors.value.find(
      (v) => v.id.toString() === selectedVendorId.value,
    );
    return vendor?.vendorLocations ?? [];
  });

  // Check for existing yard route when location changes
  const checkForYardRoute = $(async (locationId: string) => {
    if (!locationId) {
      existingYardRoute.value = null;
      return;
    }

    checkingYardRoute.value = true;
    try {
      const response = await fetch(`/api/check-yard-route?locationId=${locationId}`);
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
      console.log('Freight Route created!');
      setTimeout(() => nav(`/vendors/routes?highlight=${loc.params.id}`), 1000);
    }
  });

  return (
    <section>
      <PageSubtitle text="New Freight Route" />

      <div class="my-3">
        <BackButton />
      </div>

      <div class="card max-w-lg">
        <Form
          action={action}
          class="space-y-4"
        >
        {/* Vendor */}
        <div>
          <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Vendor</label>
          <select
            name="vendorId"
            required
            class="w-full"
            onChange$={(e) => {
              selectedVendorId.value = (e.target as HTMLSelectElement).value;
            }}
          >
            <option value="">Select a vendor</option>
            {vendors.value.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
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
            onChange$={(e) => {
              const locationId = (e.target as HTMLSelectElement).value;
              selectedLocationId.value = locationId;
              checkForYardRoute(locationId);
            }}
          >
            <option value="">Select a location</option>
            {filteredLocations.value.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
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
            class="w-full"
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
            class="w-full"
          />
        </div>

        {/* Notes */}
        <div>
          <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Notes</label>
          <textarea name="notes" rows={4} class="w-full"></textarea>
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
          <input name="isActive" type="checkbox" checked style="accent-color: rgb(var(--color-primary))" />
          <label class="text-sm font-medium" style="color: rgb(var(--color-text-primary))">Active</label>
        </div>

        <button
          type="submit"
          class="btn btn-primary"
          disabled={action.isRunning || !!destinationError.value}
        >
          {action.isRunning ? 'Saving...' : 'Save Freight Route'}
        </button>
      </Form>
      </div>

      {action.value?.success && (
        <div class="mt-4 p-3 rounded-lg" style="background-color: rgb(var(--color-success) / 0.1); color: rgb(var(--color-success))">
          Freight Route created! ID: {action.value.id}
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
