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
            value={route.vendorLocation.vendor.id}
            class="w-full"
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
          <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Vendor Location</label>
          <select
            name="vendorLocationId"
            required
            class="w-full"
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
          <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Destination</label>
          <input
            name="destination"
            type="text"
            value={route.destination}
            class="w-full"
          />
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
            value={route.notes ?? ''}
          ></textarea>
        </div>

        {/* Active toggle */}
        <div class="flex items-center gap-2">
          <input name="isActive" type="checkbox" checked={route.isActive} style="accent-color: rgb(var(--color-primary))" />
          <label class="text-sm font-medium" style="color: rgb(var(--color-text-primary))">Active</label>
        </div>

        <button
          type="submit"
          class="btn btn-primary"
        >
          Update Freight Route
        </button>
      </Form>
      </div>

      {action.value?.success && (
        <div class="mt-4 p-3 rounded-lg" style="background-color: rgb(var(--color-success) / 0.1); color: rgb(var(--color-success))">
          Route updated! Redirecting...
        </div>
      )}
    </section>
  );
});
