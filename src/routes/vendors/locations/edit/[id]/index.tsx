import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import {
  routeLoader$,
  routeAction$,
  zod$,
  z,
  Form,
} from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import PageTitle from '~/components/PageTitle';
import { useNavigate } from '@builder.io/qwik-city';
import BackButton from '~/components/BackButton';

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

  useVisibleTask$(({ track }) => {
    track(() => updateVendorLocation.value?.success);
    if (updateVendorLocation.value?.success) {
      success.value = true;
      setTimeout(() => nav('/vendor-locations'), 1200);
    }
  });

  return (
    <section class="mx-auto px-4 py-6">
      <PageTitle text="Edit Vendor Location" />

      <div class="mt-3">
        <BackButton />
      </div>

      <Form
        action={updateVendorLocation}
        class="mt-4 flex flex-col gap-4 bg-white border border-gray-200 shadow p-6 rounded-lg"
      >
        <input
          name="name"
          type="text"
          value={vendorLocation.value.name}
          required
          placeholder="Location Name"
          class="w-full border border-gray-300 rounded p-2"
        />

        <select
          name="vendorId"
          value={vendorLocation.value.vendorId}
          class="w-full border border-gray-300 rounded p-2"
          required
        >
          <option value="">Select Vendor *</option>
          {vendors.value.map((vendor) => (
            <option key={vendor.id} value={vendor.id}>
              {vendor.name} ({vendor.shortName})
            </option>
          ))}
        </select>

        <label class="inline-flex items-center gap-2 mt-2">
          <input
            name="isActive"
            type="checkbox"
            value="true"
            checked={vendorLocation.value.isActive}
            class="accent-emerald-600"
          />
          <span>Is Active</span>
        </label>

        <button
          type="submit"
          class="bg-emerald-600 text-white px-6 py-2 rounded hover:bg-emerald-700 transition-colors"
        >
          Update Vendor Location
        </button>

        {updateVendorLocation.value?.error && (
          <p class="text-red-600 font-medium">
            {updateVendorLocation.value.error}
          </p>
        )}
        {success.value && (
          <p class="text-green-600 font-medium">
            Vendor location updated! Redirecting...
          </p>
        )}
      </Form>
    </section>
  );
});
