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

      <Form action={createVendorProductAction} class="mt-4 flex flex-col">
        <input
          name="name"
          type="text"
          placeholder="Product Name *"
          class="my-2"
          required
        />

        <input
          name="productCost"
          type="number"
          min={0}
          step={0.01}
          placeholder="Product Cost *"
          class="my-2"
          required
        />

        <textarea
          name="notes"
          placeholder="Notes"
          class="my-2 border border-gray-300 rounded p-2"
          rows={3}
        />

        <select
          name="vendorId"
          class="my-2 border border-gray-300 rounded p-2"
          required
          onChange$={(e) => {
            const value = (e.target as HTMLSelectElement).value;
            selectedVendorId.value = value ? Number(value) : null;
          }}
        >
          <option value="">Select Vendor *</option>
          {vendors.value.map((vendor) => (
            <option key={vendor.id} value={vendor.id}>
              {vendor.name} ({vendor.shortName})
            </option>
          ))}
        </select>

        <select
          name="vendorLocationId"
          class="my-2 border border-gray-300 rounded p-2"
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

        <div class="flex items-center my-3 mb-4">
          <label for="isActive" class="mr-2 hover:cursor-pointer">
            Is Active
          </label>
          <input
            name="isActive"
            type="checkbox"
            id="isActive"
            value="true"
            checked
            class="hover:cursor-pointer"
          />
        </div>

        <div>
          <button
            type="submit"
            class="bg-emerald-600 text-white px-4 py-1 rounded-lg hover:bg-emerald-700 hover:cursor-pointer transition-colors duration-150 ease-in-out"
          >
            Submit
          </button>
        </div>
      </Form>

      {createVendorProductAction.value?.error ? (
        <div>
          <strong class="font-bold text-red-500">Error: </strong>
          <span>{createVendorProductAction.value.error}</span>
        </div>
      ) : createVendorProductAction.value?.success ? (
        <div class="text-foreground">
          <strong class="font-bold text-green-500">
            Vendor product created! <span>Redirecting...</span>
          </strong>
        </div>
      ) : (
        <div></div>
      )}
    </section>
  );
});
