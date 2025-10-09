import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import {
  routeAction$,
  routeLoader$,
  zod$,
  z,
  Form,
  useNavigate,
} from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import BackButton from '~/components/BackButton';
import PageSubtitle from '~/components/PageSubtitle';

export const useGetVendorsAndLocations = routeLoader$(async () => {
  const vendors = await db.vendor.findMany({
    where: { isActive: true },
    include: {
      vendorLocations: {
        where: { isActive: true },
      },
    },
    orderBy: { name: 'asc' },
  });
  return vendors;
});

export const useCreateVendorProductAction = routeAction$(
  async (data) => {
    try {
      const vendorProduct = await db.vendorProduct.create({
        data: {
          ...data,
        },
      });

      return { success: true, vendorProductId: vendorProduct.id };
    } catch (error) {
      console.error('\nVendor product creation failed:', error);
      return { success: false, error: 'Vendor product creation failed' };
    }
  },
  zod$({
    name: z.string(),
    productCost: z.coerce.number(),
    notes: z.string(),
    vendorId: z.coerce.number(),
    vendorLocationId: z.coerce.number(),
    isActive: z.coerce.boolean().optional().default(false),
  }),
);

export default component$(() => {
  const vendors = useGetVendorsAndLocations();
  const createVendorProductAction = useCreateVendorProductAction();
  const nav = useNavigate();

  const selectedVendorId = useSignal<number | null>(null);
  const availableLocations = useSignal<any[]>([]);

  // Update available locations when vendor changes
  useVisibleTask$(({ track }) => {
    const vendorId = track(() => selectedVendorId.value);
    if (vendorId) {
      const vendor = vendors.value.find((v) => v.id === vendorId);
      availableLocations.value = vendor?.vendorLocations || [];
    } else {
      availableLocations.value = [];
    }
  });

  useVisibleTask$(({ track }) => {
    const result = track(() => createVendorProductAction.value);
    if (createVendorProductAction.value?.success && result?.vendorProductId) {
      setTimeout(
        () => nav(`/vendors/products?highlight=${result.vendorProductId}`),
        1000,
      );
    }
  });

  return (
    <section>
      <PageSubtitle text="New Vendor Product" />

      <div class="mt-3">
        <BackButton />
      </div>

      <div class="card mt-4">
        <Form action={createVendorProductAction} class="flex flex-col gap-4">
          <div>
            <label
              class="block text-sm font-medium mb-2"
              style="color: rgb(var(--color-text-secondary))"
            >
              Vendor *
            </label>
            <select
              name="vendorId"
              class="w-full"
              required
              onChange$={(e) => {
                const value = (e.target as HTMLSelectElement).value;
                selectedVendorId.value = value ? Number(value) : null;
              }}
            >
              <option value="">Select Vendor *</option>
              {vendors.value.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {`${vendor.name} (${vendor.shortName})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              class="block text-sm font-medium mb-2"
              style="color: rgb(var(--color-text-secondary))"
            >
              Location *
            </label>
            <select
              name="vendorLocationId"
              class="w-full"
              required
              disabled={!selectedVendorId.value}
            >
              <option value="">
                {selectedVendorId.value
                  ? 'Select Location *'
                  : 'Select Vendor First'}
              </option>
              {availableLocations.value.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              class="block text-sm font-medium mb-2"
              style="color: rgb(var(--color-text-secondary))"
            >
              Product Name *
            </label>
            <input name="name" type="text" required class="w-full" />
          </div>

          <div>
            <label
              class="block text-sm font-medium mb-2"
              style="color: rgb(var(--color-text-secondary))"
            >
              Product Cost *
            </label>
            <input
              name="productCost"
              type="number"
              min={0}
              step={0.01}
              required
              class="w-full"
            />
          </div>

          <div>
            <label
              class="block text-sm font-medium mb-2"
              style="color: rgb(var(--color-text-secondary))"
            >
              Notes
            </label>
            <textarea name="notes" rows={3} class="w-full" />
          </div>

          <div class="flex items-center gap-2">
            <input
              name="isActive"
              type="checkbox"
              id="isActive"
              value="true"
              checked
              style="accent-color: rgb(var(--color-primary))"
            />
            <label
              for="isActive"
              class="text-sm font-medium"
              style="color: rgb(var(--color-text-primary))"
            >
              Is Active
            </label>
          </div>

          <button
            type="submit"
            class="btn btn-primary"
            disabled={createVendorProductAction.isRunning}
          >
            {createVendorProductAction.isRunning
              ? 'Creating...'
              : 'Create Vendor Product'}
          </button>
        </Form>
      </div>

      {createVendorProductAction.value?.error && (
        <div
          class="mt-4 p-3 rounded-lg"
          style="background-color: rgb(var(--color-danger) / 0.1); color: rgb(var(--color-danger))"
        >
          Error: {createVendorProductAction.value.error}
        </div>
      )}
      {createVendorProductAction.value?.success && (
        <div
          class="mt-4 p-3 rounded-lg"
          style="background-color: rgb(var(--color-success) / 0.1); color: rgb(var(--color-success))"
        >
          Vendor product created! Redirecting...
        </div>
      )}
    </section>
  );
});
