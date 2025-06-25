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
import PageTitle from '~/components/PageTitle';
import BackButton from '~/components/BackButton';

export const useGetVendors = routeLoader$(async () => {
  const vendors = await db.vendor.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
  return vendors;
});

export const useCreateVendorLocationAction = routeAction$(
  async (data) => {
    console.log('\nIncoming form data:', data);

    try {
      const vendorLocation = await db.vendorLocation.create({
        data: {
          ...data,
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
        () => nav(`/vendor-locations?highlight=${result.vendorLocationId}`),
        1000,
      );
    }
  });

  return (
    <section>
      <PageTitle text="New Vendor Location" />

      <div class="mt-3">
        <BackButton />
      </div>

      <Form
        action={createVendorLocationAction}
        class="mt-4 flex flex-col max-w-xl"
      >
        <input
          name="name"
          type="text"
          placeholder="Location Name *"
          class="my-2"
          defaultValue="Main"
          required
        />

        <select
          name="vendorId"
          class="my-2 border border-gray-300 rounded p-2"
          required
        >
          <option value="">Select Vendor *</option>
          {vendors.value.map((vendor) => (
            <option key={vendor.id} value={vendor.id}>
              {vendor.name} ({vendor.shortName})
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

      {createVendorLocationAction.value?.error ? (
        <div>
          <strong class="font-bold text-red-500">Error: </strong>
          <span>{createVendorLocationAction.value.error}</span>
        </div>
      ) : createVendorLocationAction.value?.success ? (
        <div class="text-foreground">
          <strong class="font-bold text-green-500">
            Vendor location created! <span>Redirecting...</span>
          </strong>
        </div>
      ) : (
        <div></div>
      )}
    </section>
  );
});
