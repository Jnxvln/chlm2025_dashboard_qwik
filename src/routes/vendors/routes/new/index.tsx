import {
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
    const freightRoute = await db.freightRoute.create({
      data: {
        destination: values.destination,
        freightCost: parseFloat(values.freightCost),
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

  const filteredLocations = useComputed$(() => {
    const vendor = vendors.value.find(
      (v) => v.id.toString() === selectedVendorId.value,
    );
    return vendor?.vendorLocations ?? [];
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
          <input name="destination" type="text" class="w-full" />
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

        {/* Active toggle */}
        <div class="flex items-center gap-2">
          <input name="isActive" type="checkbox" checked style="accent-color: rgb(var(--color-primary))" />
          <label class="text-sm font-medium" style="color: rgb(var(--color-text-primary))">Active</label>
        </div>

        <button
          type="submit"
          class="btn btn-primary"
          disabled={action.isRunning}
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
    </section>
  );
});
