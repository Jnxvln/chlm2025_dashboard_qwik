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

export const useCreateDriverAction = routeAction$(
  async (data) => {
    console.log('\nIncoming form data:', data);

    const { dateHired, dateReleased, ...rest } = data;

    try {
      const driver = await db.driver.create({
        data: {
          ...rest,
          // Convert string to Date if present
          dateHired: dateHired || null,
          dateReleased: dateReleased || null,
        },
      });

      return { success: true, driverId: driver.id };
    } catch (error) {
      console.error('\nDriver creation failed:', error);
      return { success: false, error: 'Driver creation failed' };
    }
  },
  zod$({
    firstName: z.string(),
    lastName: z.string(),
    defaultTruck: z.string().optional(),
    endDumpPayRate: z.coerce.number(),
    flatBedPayRate: z.coerce.number(),
    nonCommissionRate: z.coerce.number(),
    dateHired: z
      .string()
      .optional()
      .transform((s) => (s ? new Date(s) : null)),
    dateReleased: z
      .string()
      .optional()
      .transform((s) => (s ? new Date(s) : null)),
    isActive: z.coerce.boolean().optional().default(false),
  }),
);

export default component$(() => {
  const createDriverAction = useCreateDriverAction();
  const nav = useNavigate();

  useVisibleTask$(({ track }) => {
    const result = track(() => createDriverAction.value);
    if (createDriverAction.value?.success && result?.driverId) {
      setTimeout(() => nav(`/drivers?highlight=${result.driverId}`), 1000);
    }
  });

  return (
    <section>
      <PageTitle text="New Driver" />

      <div class="mt-3">
        <BackButton />
      </div>

      <div class="card mt-4 max-w-xl">
        <Form action={createDriverAction} class="flex flex-col gap-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">First Name *</label>
            <input
              name="firstName"
              type="text"
              required
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Last Name *</label>
            <input
              name="lastName"
              type="text"
              required
              class="w-full"
            />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Default Truck #</label>
          <input name="defaultTruck" type="text" class="w-full" />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">End Dump Pay Rate *</label>
          <input
            name="endDumpPayRate"
            type="number"
            min={0}
            step={0.01}
            required
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Flatbed Pay Rate *</label>
          <input
            name="flatBedPayRate"
            type="number"
            min={0}
            step={0.01}
            required
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Non-commission Rate *</label>
          <input
            name="nonCommissionRate"
            type="number"
            min={0}
            step={0.01}
            required
            class="w-full"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Date Hired</label>
            <input
              name="dateHired"
              type="datetime-local"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Date Released</label>
            <input
              name="dateReleased"
              type="datetime-local"
              class="w-full"
            />
          </div>
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
          <label for="isActive" class="text-sm font-medium" style="color: rgb(var(--color-text-primary))">
            Is Active
          </label>
        </div>

        <button
          type="submit"
          class="btn btn-primary"
        >
          Create Driver
        </button>
      </Form>
      </div>

      {createDriverAction.value?.error && (
        <div class="mt-4 p-3 rounded-lg" style="background-color: rgb(var(--color-danger) / 0.1); color: rgb(var(--color-danger))">
          Error: {createDriverAction.value.error}
        </div>
      )}
      {createDriverAction.value?.success && (
        <div class="mt-4 p-3 rounded-lg" style="background-color: rgb(var(--color-success) / 0.1); color: rgb(var(--color-success))">
          Driver created! Redirecting...
        </div>
      )}
    </section>
  );
});
