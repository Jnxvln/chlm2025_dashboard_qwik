import { component$, useVisibleTask$ } from '@builder.io/qwik';
import {
  routeAction$,
  zod$,
  z,
  Form,
  useNavigate,
} from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import PageTitle from '~/components/PageTitle';
import BackButton from '~/components/BackButton';

export const useCreateVendorAction = routeAction$(
  async (data) => {
    console.log('\nIncoming form data:', data);

    try {
      const vendor = await db.vendor.create({
        data: {
          ...data,
        },
      });

      return { success: true, vendorId: vendor.id };
    } catch (error) {
      console.error('\nVendor creation failed:', error);
      return { success: false, error: 'Vendor creation failed' };
    }
  },
  zod$({
    name: z.string(),
    shortName: z.string(),
    chtFuelSurcharge: z.coerce.number(),
    vendorFuelSurcharge: z.coerce.number(),
    isActive: z.coerce.boolean().optional().default(false),
  }),
);

export default component$(() => {
  const createVendorAction = useCreateVendorAction();
  const nav = useNavigate();

  useVisibleTask$(({ track }) => {
    const result = track(() => createVendorAction.value);
    if (createVendorAction.value?.success && result?.vendorId) {
      setTimeout(() => nav(`/vendors?highlight=${result.vendorId}`), 1000);
    }
  });

  return (
    <section>
      <PageTitle text="New Vendor" />

      <div class="mt-3">
        <BackButton />
      </div>

      <Form action={createVendorAction} class="mt-4 flex flex-col max-w-xl">
        <div class="flex my-2 items-center gap-2">
          <input name="name" type="text" placeholder="Vendor Name *" required />
          <input
            name="shortName"
            type="text"
            placeholder="Short Name *"
            required
          />
        </div>

        <input
          name="chtFuelSurcharge"
          type="number"
          min={0}
          step={0.01}
          placeholder="CHT Fuel Surcharge *"
          class="my-2"
          required
        />
        <input
          name="vendorFuelSurcharge"
          type="number"
          min={0}
          step={0.01}
          placeholder="Vendor Fuel Surcharge *"
          class="my-2"
          required
        />

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

      {createVendorAction.value?.error ? (
        <div>
          <strong class="font-bold text-red-500">Error: </strong>
          <span>{createVendorAction.value.error}</span>
        </div>
      ) : createVendorAction.value?.success ? (
        <div class="text-foreground">
          <strong class="font-bold text-green-500">
            Vendor created! <span>Redirecting...</span>
          </strong>
        </div>
      ) : (
        <div></div>
      )}
    </section>
  );
});
