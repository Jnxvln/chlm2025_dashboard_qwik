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
import PageSubtitle from '~/components/PageSubtitle';

export const useVendorProduct = routeLoader$(async ({ params }) => {
  const id = Number(params.id);
  const vendorProduct = await db.vendorProduct.findUnique({
    where: { id },
    include: {
      vendor: true,
      vendorLocation: true,
    },
  });

  if (!vendorProduct) throw new Error('Vendor product not found');
  return vendorProduct;
});

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

export const useUpdateVendorProduct = routeAction$(
  async (data, { params }) => {
    const id = Number(params.id);

    try {
      await db.vendorProduct.update({
        where: { id },
        data: {
          ...data,
        },
      });

      return { success: true, vendorProductId: data.id };
    } catch (err) {
      console.error('Update failed', err);
      return { success: false, error: 'Update failed' };
    }
  },
  zod$(
    z.object({
      name: z.string(),
      productCost: z.coerce.number(),
      notes: z.string(),
      vendorId: z.coerce.number(),
      vendorLocationId: z.coerce.number(),
      isActive: z.coerce.boolean().optional().default(false),
    }),
  ),
);

export default component$(() => {
  const vendorProduct = useVendorProduct();
  const vendors = useGetVendorsAndLocations();
  const updateVendorProduct = useUpdateVendorProduct();
  const success = useSignal(false);
  const nav = useNavigate();

  // const selectedVendorId = useSignal<number>(vendorProduct.value.vendorId);
  const selectedVendorId = useSignal<number | undefined>(undefined);
  const availableLocations = useSignal<any[]>([]);

  // Initialize selected vendor ID with current vendor ID from the vendorProduct object
  useVisibleTask$(() => {
    selectedVendorId.value = vendorProduct.value.vendorId;
  });

  // Initialize available locations on component load
  useVisibleTask$(() => {
    const vendor = vendors.value.find(
      (v) => v.id === vendorProduct.value.vendorId,
    );
    availableLocations.value = vendor?.vendorLocations || [];
  });

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
    track(() => updateVendorProduct.value?.success);
    if (updateVendorProduct.value?.success) {
      success.value = true;
      setTimeout(() => nav('/vendors/products'), 1200);
    }
  });

  return (
    <section class="mx-auto px-4 py-6">
      <PageSubtitle text="Edit Vendor Product" />

      <Form
        action={updateVendorProduct}
        class="mt-4 flex flex-col gap-4 bg-white border border-gray-200 shadow p-6 rounded-lg"
      >
        <input
          name="name"
          type="text"
          value={vendorProduct.value.name}
          required
          placeholder="Product Name"
          class="w-full border border-gray-300 rounded p-2"
        />

        <input
          name="productCost"
          type="number"
          step="0.01"
          value={vendorProduct.value.productCost}
          placeholder="Product Cost"
          class="w-full border border-gray-300 rounded p-2"
        />

        <textarea
          name="notes"
          value={vendorProduct.value.notes}
          placeholder="Notes"
          class="w-full border border-gray-300 rounded p-2"
          rows={3}
        />

        <select
          name="vendorId"
          // defaultValue={String(vendorProduct.value.vendorId)}
          // value={selectedVendorId.value}
          value={selectedVendorId.value ?? ''}
          class="w-full border border-gray-300 rounded p-2"
          required
          onChange$={(e) => {
            // const value = (e.target as HTMLSelectElement).value;
            // selectedVendorId.value = Number(value);
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

        {availableLocations.value.length > 0 && (
          <select
            name="vendorLocationId"
            // value={vendorProduct.value.vendorLocationId}
            value={vendorProduct.value.vendorLocation?.id}
            class="w-full border border-gray-300 rounded p-2"
            required
          >
            <option value="">Select Location *</option>
            {availableLocations.value.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        )}

        <label class="inline-flex items-center gap-2 mt-2">
          <input
            name="isActive"
            type="checkbox"
            value="true"
            checked={vendorProduct.value.isActive}
            class="accent-emerald-600"
          />
          <span>Is Active</span>
        </label>

        <button
          type="submit"
          class="bg-emerald-600 text-white px-6 py-2 rounded hover:bg-emerald-700 transition-colors"
        >
          Update Vendor Product
        </button>

        {updateVendorProduct.value?.error && (
          <p class="text-red-600 font-medium">
            {updateVendorProduct.value.error}
          </p>
        )}
        {success.value && (
          <p class="text-green-600 font-medium">
            Vendor product updated! Redirecting...
          </p>
        )}
      </Form>
    </section>
  );
});
