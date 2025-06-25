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

export const useVendor = routeLoader$(async ({ params }) => {
  const id = Number(params.id);
  const vendor = await db.vendor.findUnique({
    where: { id },
  });

  if (!vendor) throw new Error('Vendor not found');
  return vendor;
});

export const useUpdateVendor = routeAction$(
  async (data, { params }) => {
    const id = Number(params.id);

    try {
      await db.vendor.update({
        where: { id },
        data: {
          ...data,
        },
      });

      return { success: true, vendorId: data.id };
    } catch (err) {
      console.error('Update failed', err);
      return { success: false, error: 'Update failed' };
    }
  },
  zod$(
    z.object({
      name: z.string(),
      shortName: z.string(),
      chtFuelSurcharge: z.coerce.number(),
      vendorFuelSurcharge: z.coerce.number(),
      isActive: z.coerce.boolean().optional().default(false),
    }),
  ),
);

export default component$(() => {
  const vendor = useVendor();
  const updateVendor = useUpdateVendor();
  const success = useSignal(false);
  const nav = useNavigate();

  useVisibleTask$(({ track }) => {
    track(() => updateVendor.value?.success);
    if (updateVendor.value?.success) {
      success.value = true;
      setTimeout(() => nav('/vendors'), 1200);
    }
  });

  return (
    <section class="max-w-3xl mx-auto px-4 py-6">
      <PageTitle text="Edit Vendor" />

      <div class="mt-3">
        <BackButton />
      </div>

      <Form
        action={updateVendor}
        class="mt-4 flex flex-col gap-4 bg-white border border-gray-200 shadow p-6 rounded-lg"
      >
        <div class="flex gap-4">
          <input
            name="name"
            type="text"
            value={vendor.value.name}
            required
            placeholder="Vendor Name"
            class="w-full border border-gray-300 rounded p-2"
          />
          <input
            name="shortName"
            type="text"
            value={vendor.value.shortName}
            required
            placeholder="Short Name"
            class="w-full border border-gray-300 rounded p-2"
          />
        </div>

        <input
          name="chtFuelSurcharge"
          type="number"
          step="0.01"
          value={vendor.value.chtFuelSurcharge}
          placeholder="CHT Fuel Surcharge"
          class="w-full border border-gray-300 rounded p-2"
        />

        <input
          name="vendorFuelSurcharge"
          type="number"
          step="0.01"
          value={vendor.value.vendorFuelSurcharge}
          placeholder="Vendor Fuel Surcharge"
          class="w-full border border-gray-300 rounded p-2"
        />

        <label class="inline-flex items-center gap-2 mt-2">
          <input
            name="isActive"
            type="checkbox"
            value="true"
            checked={vendor.value.isActive}
            class="accent-emerald-600"
          />
          <span>Is Active</span>
        </label>

        <button
          type="submit"
          class="bg-emerald-600 text-white px-6 py-2 rounded hover:bg-emerald-700 transition-colors"
        >
          Update Vendor
        </button>

        {updateVendor.value?.error && (
          <p class="text-red-600 font-medium">{updateVendor.value.error}</p>
        )}
        {success.value && (
          <p class="text-green-600 font-medium">
            Vendor updated! Redirecting...
          </p>
        )}
      </Form>
    </section>
  );
});
