import { component$, useVisibleTask$ } from '@builder.io/qwik';
import {
  routeAction$,
  zod$,
  z,
  Form,
  useNavigate,
} from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { normalizeFormData } from '~/lib/text-utils';
import PageTitle from '~/components/PageTitle';
import BackButton from '~/components/BackButton';

// Create Vendor action
export const useCreateVendorAction = routeAction$(
  async (values) => {
    try {
      // Normalize capitalization before saving
      const normalized = normalizeFormData(values);

      const vendor = await db.vendor.create({
        data: {
          ...normalized,
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
  // -

  useVisibleTask$(({ track }) => {
    const result = track(() => createVendorAction.value);
    if (createVendorAction.value?.success && result?.vendorId) {
      setTimeout(() => nav(`/vendors?highlight=${result.vendorId}`), 1000);
    }
  });

  return (
    <section>
      <div class="mb-6">
        <BackButton />
        <PageTitle text="New Vendor" />
      </div>

      <div class="card max-w-xl">
        <Form action={createVendorAction} class="flex flex-col gap-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label
                class="block text-sm font-medium mb-2"
                style="color: rgb(var(--color-text-secondary))"
              >
                Vendor Name *
              </label>
              <input name="name" type="text" required class="w-full" />
            </div>
            <div>
              <label
                class="block text-sm font-medium mb-2"
                style="color: rgb(var(--color-text-secondary))"
              >
                Short Name *
              </label>
              <input name="shortName" type="text" required class="w-full" />
            </div>
          </div>

          <div>
            <label
              class="block text-sm font-medium mb-2"
              style="color: rgb(var(--color-text-secondary))"
            >
              CHT Fuel Surcharge *
            </label>
            <input
              name="chtFuelSurcharge"
              type="number"
              min={0}
              step={0.01}
              value="0.00"
              required
              class="w-full"
              onBlur$={(e) => {
                const target = e.target as HTMLInputElement;
                const value = parseFloat(target.value);
                if (!isNaN(value)) {
                  target.value = value.toFixed(2);
                }
              }}
            />
          </div>
          <div>
            <label
              class="block text-sm font-medium mb-2"
              style="color: rgb(var(--color-text-secondary))"
            >
              Vendor Fuel Surcharge *
            </label>
            <input
              name="vendorFuelSurcharge"
              type="number"
              min={0}
              step={0.01}
              value="0.00"
              required
              class="w-full"
              onBlur$={(e) => {
                const target = e.target as HTMLInputElement;
                const value = parseFloat(target.value);
                if (!isNaN(value)) {
                  target.value = value.toFixed(2);
                }
              }}
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
            disabled={createVendorAction.isRunning}
          >
            {createVendorAction.isRunning ? 'Creating...' : 'Create Vendor'}
          </button>
        </Form>
      </div>

      {createVendorAction.value?.error && (
        <div
          class="mt-4 p-3 rounded-lg"
          style="background-color: rgb(var(--color-danger) / 0.1); color: rgb(var(--color-danger))"
        >
          Error: {createVendorAction.value.error}
        </div>
      )}
      {createVendorAction.value?.success && (
        <div
          class="mt-4 p-3 rounded-lg"
          style="background-color: rgb(var(--color-success) / 0.1); color: rgb(var(--color-success))"
        >
          Vendor created! Redirecting...
        </div>
      )}
    </section>
  );
});
