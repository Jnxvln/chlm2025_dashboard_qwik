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

      return { success: true, vendorId: id };
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
    <div class="container mx-auto p-6 max-w-2xl">
      <div class="mb-6">
        <BackButton />
        <PageSubtitle text="Edit Vendor" />
      </div>

      <div class="card">
        <Form action={updateVendor} class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                for="name"
                class="block text-sm font-medium mb-2"
                style="color: rgb(var(--color-text-secondary))"
              >
                Vendor Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={vendor.value.name}
                required
                placeholder="Vendor Name"
                class="w-full"
              />
            </div>
            <div>
              <label
                for="shortName"
                class="block text-sm font-medium mb-2"
                style="color: rgb(var(--color-text-secondary))"
              >
                Short Name *
              </label>
              <input
                id="shortName"
                name="shortName"
                type="text"
                value={vendor.value.shortName}
                required
                placeholder="Short Name"
                class="w-full"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                for="chtFuelSurcharge"
                class="block text-sm font-medium mb-2"
                style="color: rgb(var(--color-text-secondary))"
              >
                CHT Fuel Surcharge
              </label>
              <input
                id="chtFuelSurcharge"
                name="chtFuelSurcharge"
                type="number"
                step="0.01"
                value={vendor.value.chtFuelSurcharge}
                placeholder="0.00"
                class="w-full"
              />
            </div>
            <div>
              <label
                for="vendorFuelSurcharge"
                class="block text-sm font-medium mb-2"
                style="color: rgb(var(--color-text-secondary))"
              >
                Vendor Fuel Surcharge
              </label>
              <input
                id="vendorFuelSurcharge"
                name="vendorFuelSurcharge"
                type="number"
                step="0.01"
                value={vendor.value.vendorFuelSurcharge}
                placeholder="0.00"
                class="w-full"
              />
            </div>
          </div>

          <div class="flex items-center">
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              value="true"
              checked={vendor.value.isActive}
              class="h-4 w-4 rounded"
              style="accent-color: rgb(var(--color-primary))"
            />
            <label
              for="isActive"
              class="ml-2 block text-sm font-medium"
              style="color: rgb(var(--color-text-primary))"
            >
              Is Active
            </label>
          </div>

          {updateVendor.value?.error && (
            <div class="p-3 rounded-lg" style="background-color: rgb(var(--color-danger) / 0.1); color: rgb(var(--color-danger))">
              {updateVendor.value.error}
            </div>
          )}
          {success.value && (
            <div class="p-3 rounded-lg" style="background-color: rgb(var(--color-success) / 0.1); color: rgb(var(--color-success))">
              Vendor updated! Redirecting...
            </div>
          )}

          <div class="flex justify-end gap-3">
            <a href="/vendors" class="btn btn-ghost">Cancel</a>
            <button type="submit" class="btn btn-primary">
              Update Vendor
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
});
