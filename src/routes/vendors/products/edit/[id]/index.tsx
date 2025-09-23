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
import BackButton from '~/components/BackButton';

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
    <div class="container mx-auto p-6">
      <div class="mb-6">
        <BackButton />
        <PageSubtitle text="Edit Vendor Product" />
      </div>

      <div class="card">
        <Form
          action={updateVendorProduct}
          class="space-y-6"
        >
        <div>
          <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Product Name *</label>
          <input
            name="name"
            type="text"
            value={vendorProduct.value.name}
            required
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Product Cost</label>
          <input
            name="productCost"
            type="number"
            step="0.01"
            value={vendorProduct.value.productCost}
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Notes</label>
          <textarea
            name="notes"
            value={vendorProduct.value.notes}
            class="w-full"
            rows={3}
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

        {availableLocations.value.length > 0 && (
          <div>
            <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Location *</label>
            <select
              name="vendorLocationId"
              value={vendorProduct.value.vendorLocation?.id}
              class="w-full"
              required
            >
              <option value="">Select Location *</option>
              {availableLocations.value.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div class="flex items-center gap-2">
          <input
            name="isActive"
            type="checkbox"
            value="true"
            checked={vendorProduct.value.isActive}
            style="accent-color: rgb(var(--color-primary))"
          />
          <label class="text-sm font-medium" style="color: rgb(var(--color-text-primary))">Is Active</label>
        </div>

        {updateVendorProduct.value?.error && (
          <div class="p-3 rounded-lg" style="background-color: rgb(var(--color-danger) / 0.1); color: rgb(var(--color-danger))">
            {updateVendorProduct.value.error}
          </div>
        )}
        {success.value && (
          <div class="p-3 rounded-lg" style="background-color: rgb(var(--color-success) / 0.1); color: rgb(var(--color-success))">
            Vendor product updated! Redirecting...
          </div>
        )}

        <div class="flex justify-end gap-3">
          <a href="/vendors/products" class="btn btn-ghost">Cancel</a>
          <button
            type="submit"
            class="btn btn-primary"
          >
            Update Vendor Product
          </button>
        </div>
      </Form>
      </div>
    </div>
  );
});
