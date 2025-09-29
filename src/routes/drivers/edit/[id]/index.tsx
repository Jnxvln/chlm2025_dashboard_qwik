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

export const useDriver = routeLoader$(async ({ params }) => {
  const id = Number(params.id);
  const driver = await db.driver.findUnique({
    where: { id },
  });

  if (!driver) throw new Error('Driver not found');
  return driver;
});

export const useUpdateDriver = routeAction$(
  async (data, { params }) => {
    const id = Number(params.id);
    const { dateHired, dateReleased, ...rest } = data;

    try {
      // Convert date strings to Date objects (use UTC to avoid timezone shifts)
      const processedDateHired = dateHired ? new Date(dateHired + 'T12:00:00Z') : null;
      const processedDateReleased = dateReleased ? new Date(dateReleased + 'T12:00:00Z') : null;

      await db.driver.update({
        where: { id },
        data: {
          ...rest,
          dateHired: processedDateHired,
          dateReleased: processedDateReleased,
        },
      });

      return { success: true, driverId: id };
    } catch (err) {
      console.error('Update failed', err);
      return { 
        success: false, 
        error: `Driver update failed: ${err instanceof Error ? err.message : 'Unknown error'}` 
      };
    }
  },
  zod$(
    z.object({
      firstName: z.string(),
      lastName: z.string(),
      defaultTruck: z.string().optional(),
      endDumpPayRate: z.coerce.number(),
      flatBedPayRate: z.coerce.number(),
      nonCommissionRate: z.coerce.number(),
      dateHired: z.string().optional(),
      dateReleased: z.string().optional(),
      isActive: z.coerce.boolean().optional().default(false),
    }),
  ),
);

export default component$(() => {
  const driver = useDriver();
  const updateDriver = useUpdateDriver();
  const success = useSignal(false);
  const nav = useNavigate();

  useVisibleTask$(({ track }) => {
    track(() => updateDriver.value?.success);
    if (updateDriver.value?.success) {
      success.value = true;
      setTimeout(() => nav('/drivers'), 1200);
    }
  });

  return (
    <section class="max-w-3xl mx-auto px-4 py-6">
      <PageTitle text="Edit Driver" />

      <div class="mt-3">
        <BackButton />
      </div>

      <div class="card mt-4">
        <Form
          action={updateDriver}
          class="flex flex-col gap-4"
        >
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">First Name *</label>
            <input
              name="firstName"
              type="text"
              value={driver.value.firstName}
              required
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Last Name *</label>
            <input
              name="lastName"
              type="text"
              value={driver.value.lastName}
              required
              class="w-full"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Default Truck</label>
          <input
            name="defaultTruck"
            type="text"
            value={driver.value.defaultTruck ?? ''}
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">End Dump Pay Rate</label>
          <input
            name="endDumpPayRate"
            type="number"
            step="0.01"
            value={driver.value.endDumpPayRate}
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Flatbed Pay Rate</label>
          <input
            name="flatBedPayRate"
            type="number"
            step="0.01"
            value={driver.value.flatBedPayRate}
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Non-Commission Rate</label>
          <input
            name="nonCommissionRate"
            type="number"
            step="0.01"
            value={driver.value.nonCommissionRate}
            class="w-full"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Date Hired</label>
            <input
              name="dateHired"
              type="date"
              value={
                driver.value.dateHired
                  ? new Date(driver.value.dateHired).toISOString().slice(0, 10)
                  : ''
              }
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Date Released</label>
            <input
              name="dateReleased"
              type="date"
              value={
                driver.value.dateReleased
                  ? new Date(driver.value.dateReleased).toISOString().slice(0, 10)
                  : ''
              }
              class="w-full"
            />
          </div>
        </div>

        <div class="flex items-center gap-2">
          <input
            name="isActive"
            type="checkbox"
            value="true"
            checked={driver.value.isActive}
            style="accent-color: rgb(var(--color-primary))"
          />
          <label class="text-sm font-medium" style="color: rgb(var(--color-text-primary))">Is Active</label>
        </div>

        <button
          type="submit"
          class="btn btn-primary"
          disabled={updateDriver.isRunning || success.value}
        >
          {updateDriver.isRunning ? 'Updating...' : 'Update Driver'}
        </button>

        {updateDriver.value?.error && (
          <div class="p-3 rounded-lg" style="background-color: rgb(var(--color-danger) / 0.1); color: rgb(var(--color-danger))">
            {updateDriver.value.error}
          </div>
        )}
        {success.value && (
          <div class="p-3 rounded-lg" style="background-color: rgb(var(--color-success) / 0.1); color: rgb(var(--color-success))">
            Driver updated! Redirecting...
          </div>
        )}
      </Form>
      </div>
    </section>
  );
});
