import { component$, useVisibleTask$ } from '@builder.io/qwik';
import {
  routeAction$,
  routeLoader$,
  zod$,
  z,
  Form,
  useNavigate,
} from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { normalizeFormData } from '~/lib/text-utils';
import BackButton from '~/components/BackButton';
import PageSubtitle from '~/components/PageSubtitle';

export const useGetVendors = routeLoader$(async () => {
  const vendors = await db.vendor.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
  return vendors;
});

export const useCreateVendorLocationAction = routeAction$(
  async (values) => {
    try {
      // Normalize capitalization before saving
      const normalized = normalizeFormData(values);

      const vendorLocation = await db.vendorLocation.create({
        data: {
          ...normalized,
        },
      });

      return { success: true, vendorLocationId: vendorLocation.id };
    } catch (error) {
      console.error('\nVendor location creation failed:', error);
      return { success: false, error: 'Vendor location creation failed' };
    }
  },
  zod$({
    name: z.string(),
    vendorId: z.coerce.number(),
    isActive: z.coerce.boolean().optional().default(false),
  }),
);

export default component$(() => {
  const vendors = useGetVendors();
  const createVendorLocationAction = useCreateVendorLocationAction();
  const nav = useNavigate();

  useVisibleTask$(({ track }) => {
    const result = track(() => createVendorLocationAction.value);
    if (createVendorLocationAction.value?.success && result?.vendorLocationId) {
      setTimeout(
        () => nav(`/vendors/locations?highlight=${result.vendorLocationId}`),
        1000,
      );
    }
  });

  return (
    <section>
      <PageSubtitle text="New Vendor Location" />

      <div class="mt-3">
        <BackButton />
      </div>

      <div class="card mt-4 max-w-xl">
        <Form action={createVendorLocationAction} class="flex flex-col gap-4">
          <div>
            <label
              class="block text-sm font-medium mb-2"
              style="color: rgb(var(--color-text-secondary))"
            >
              Vendor *
            </label>
            <select name="vendorId" class="w-full" required>
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
              Location Name *
            </label>
            <input
              name="name"
              type="text"
              defaultValue="Main"
              required
              class="w-full"
            />
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
            disabled={createVendorLocationAction.isRunning}
          >
            {createVendorLocationAction.isRunning
              ? 'Creating...'
              : 'Create Vendor Location'}
          </button>
        </Form>
      </div>

      {createVendorLocationAction.value?.error && (
        <div
          class="mt-4 p-3 rounded-lg"
          style="background-color: rgb(var(--color-danger) / 0.1); color: rgb(var(--color-danger))"
        >
          Error: {createVendorLocationAction.value.error}
        </div>
      )}
      {createVendorLocationAction.value?.success && (
        <div
          class="mt-4 p-3 rounded-lg"
          style="background-color: rgb(var(--color-success) / 0.1); color: rgb(var(--color-success))"
        >
          Vendor location created! Redirecting...
        </div>
      )}
    </section>
  );
});
