import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import {
  routeLoader$,
  routeAction$,
  zod$,
  z,
  Form,
} from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { useNavigate } from '@builder.io/qwik-city';
import BackButton from '~/components/BackButton';
import PageSubtitle from '~/components/PageSubtitle';

export const useVendorLocation = routeLoader$(async ({ params }) => {
  const id = Number(params.id);
  const vendorLocation = await db.vendorLocation.findUnique({
    where: { id },
    include: { vendor: true },
  });

  if (!vendorLocation) throw new Error('Vendor location not found');
  return vendorLocation;
});

export const useGetVendors = routeLoader$(async () => {
  const vendors = await db.vendor.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
  return vendors;
});

export const useUpdateVendorLocation = routeAction$(
  async (data, { params }) => {
    const id = Number(params.id);

    try {
      await db.vendorLocation.update({
        where: { id },
        data: {
          ...data,
        },
      });

      return { success: true, vendorLocationId: data.id };
    } catch (err) {
      console.error('Update failed', err);
      return { success: false, error: 'Update failed' };
    }
  },
  zod$(
    z.object({
      name: z.string(),
      vendorId: z.coerce.number(),
      isActive: z.coerce.boolean().optional().default(false),
    }),
  ),
);

export default component$(() => {
  const vendorLocation = useVendorLocation();
  const vendors = useGetVendors();
  const updateVendorLocation = useUpdateVendorLocation();
  const success = useSignal(false);
  const nav = useNavigate();

  const selectedVendorId = useSignal<number | undefined>(undefined);

  useVisibleTask$(() => {
    selectedVendorId.value = vendorLocation.value.vendorId;
  });

  useVisibleTask$(({ track }) => {
    track(() => updateVendorLocation.value?.success);
    if (updateVendorLocation.value?.success) {
      success.value = true;
      setTimeout(() => nav('/vendor-locations'), 1200);
    }
  });

  return (
    <section class="mx-auto px-4 py-6">
      <PageSubtitle text="Edit Vendor Location" />

      <div class="mt-3">
        <BackButton />
      </div>

      <div class="card mt-4">
        <Form
          action={updateVendorLocation}
          class="flex flex-col gap-4"
        >
        <div>
          <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Location Name *</label>
          <input
            name="name"
            type="text"
            value={vendorLocation.value.name}
            required
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Vendor *</label>
          <select
            name="vendorId"
            value={selectedVendorId.value ?? ''}
            class="w-full"
            required
            onChange$={(e) => {
              selectedVendorId.value = Number(
                (e.target as HTMLSelectElement).value,
              );
            }}
          >
          <option value="">Select Vendor *</option>
          {vendors.value.map((vendor) => (
            <option key={vendor.id} value={vendor.id}>
              {vendor.name} ({vendor.shortName})
            </option>
          ))}
          </select>
        </div>

        <div class="flex items-center gap-2">
          <input
            name="isActive"
            type="checkbox"
            value="true"
            checked={vendorLocation.value.isActive}
            style="accent-color: rgb(var(--color-primary))"
          />
          <label class="text-sm font-medium" style="color: rgb(var(--color-text-primary))">Is Active</label>
        </div>

        <button
          type="submit"
          class="btn btn-primary"
        >
          Update Vendor Location
        </button>

        {updateVendorLocation.value?.error && (
          <div class="p-3 rounded-lg" style="background-color: rgb(var(--color-danger) / 0.1); color: rgb(var(--color-danger))">
            {updateVendorLocation.value.error}
          </div>
        )}
        {success.value && (
          <div class="p-3 rounded-lg" style="background-color: rgb(var(--color-success) / 0.1); color: rgb(var(--color-success))">
            Vendor location updated! Redirecting...
          </div>
        )}
      </Form>
      </div>
    </section>
  );
});
