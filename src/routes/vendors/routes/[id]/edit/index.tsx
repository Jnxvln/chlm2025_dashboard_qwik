import {
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

  const vendors = await db.vendor.findMany({
    where: { isActive: true },
    include: {
      vendorLocations: {
        where: { isActive: true },
        orderBy: [{ name: 'asc' }],
      },
    },
    orderBy: [{ name: 'asc' }],
  });

  if (!freightRoute) {
    throw event.error(404, 'Freight route not found');
  }

  return {
    freightRoute,
    vendors,
  };
});

export const useUpdateFreightRoute = routeAction$(
  async (values, event) => {
    const id = parseInt(event.params.id);

    await db.freightRoute.update({
      where: { id },
      data: {
        destination: values.destination,
        freightCost: parseFloat(values.freightCost),
        isActive: values.isActive === 'on',
        notes: values.notes || null,
        vendorLocationId: parseInt(values.vendorLocationId),
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

  // Default vendor selection based on existing route
  useVisibleTask$(() => {
    selectedVendorId.value =
      data.value.freightRoute.vendorLocation.vendor.id.toString();
  });

  // Return to routes listing after submission
  useVisibleTask$(({ track }) => {
    const result = track(() => action.value);
    if (result?.success) {
      console.log('Freight Route updated!');
      setTimeout(() => nav(`/vendors/routes?highlight=${loc.params.id}`), 1000);
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
            value={route.vendorLocation.vendor.id}
            class="w-full rounded border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            onChange$={(e) => {
              selectedVendorId.value = (e.target as HTMLSelectElement).value;
            }}
          >
            <option value="">Select a vendor</option>
            {data.value.vendors.map((vendor) => (
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
              <option
                key={loc.id}
                value={loc.id}
                selected={loc.id === route.vendorLocation.id}
              >
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Destination */}
        <div>
          <label class="block font-medium mb-1">Destination</label>
          <input
            name="destination"
            type="text"
            value={route.destination}
            class="input w-full"
          />
        </div>

        {/* Freight Cost */}
        <div>
          <label class="block font-medium mb-1">Freight Cost (per ton)</label>
          <input
            name="freightCost"
            type="number"
            step="0.01"
            value={route.freightCost}
            class="input w-full"
          />
        </div>

        {/* Notes */}
        <div>
          <label class="block font-medium mb-1">Notes</label>
          <textarea
            name="notes"
            rows={4}
            class="input w-full"
            value={route.notes ?? ''}
          ></textarea>
        </div>

        {/* Active toggle */}
        <div class="flex items-center gap-2">
          <input name="isActive" type="checkbox" checked={route.isActive} />
          <label>Active</label>
        </div>

        <button
          type="submit"
          class="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
        >
          Update Freight Route
        </button>
      </Form>

      {action.value?.success && (
        <p class="text-green-700 mt-4">Route updated! Redirecting...</p>
      )}
    </section>
  );
});
