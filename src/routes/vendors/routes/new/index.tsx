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

      <Form
        action={action}
        class="space-y-4 bg-white p-6 rounded shadow max-w-lg"
      >
        {/* Vendor */}
        <div>
          <label class="block font-medium mb-1">Vendor</label>
          <select
            name="vendorId"
            required
            class="w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
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
          <label class="block font-medium mb-1">Vendor Location</label>
          <select
            name="vendorLocationId"
            required
            class="w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
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
          <label class="block font-medium mb-1">Destination</label>
          <input name="destination" type="text" class="input w-full" />
        </div>

        {/* Freight Cost */}
        <div>
          <label class="block font-medium mb-1">Freight Cost (per ton)</label>
          <input
            name="freightCost"
            type="number"
            step="0.01"
            class="input w-full"
          />
        </div>

        {/* Notes */}
        <div>
          <label class="block font-medium mb-1">Notes</label>
          <textarea name="notes" rows={4} class="input w-full"></textarea>
        </div>

        {/* Active toggle */}
        <div class="flex items-center gap-2">
          <input name="isActive" type="checkbox" checked />
          <label>Active</label>
        </div>

        <button
          type="submit"
          class="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
        >
          Save Freight Route
        </button>
      </Form>

      {action.value?.success && (
        <p class="text-green-700 mt-4">
          Freight Route created! ID: {action.value.id}
        </p>
      )}
    </section>
  );
});
