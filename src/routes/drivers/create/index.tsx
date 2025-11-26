import { component$, useVisibleTask$, $ } from '@builder.io/qwik';
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
import StatusMessage from '~/components/notifications/StatusMessage';

export const useCreateDriverAction = routeAction$(
  async (values) => {
    try {
      // Normalize capitalization before saving
      const normalized = normalizeFormData(values);

      // Convert date strings to Date objects (use UTC to avoid timezone shifts)
      const processedDateHired = normalized.dateHired ? new Date(normalized.dateHired + 'T12:00:00Z') : null;
      const processedDateReleased = normalized.dateReleased ? new Date(normalized.dateReleased + 'T12:00:00Z') : null;

      const driver = await db.driver.create({
        data: {
          firstName: normalized.firstName,
          lastName: normalized.lastName,
          defaultTruck: normalized.defaultTruck || null,
          endDumpPayRate: normalized.endDumpPayRate,
          flatBedPayRate: normalized.flatBedPayRate,
          nonCommissionRate: normalized.nonCommissionRate,
          dateHired: processedDateHired,
          dateReleased: processedDateReleased,
          isActive: normalized.isActive === true,
        },
      });

      return { success: true, driverId: driver.id };
    } catch (error) {
      return {
        success: false,
        error: `Driver creation failed: ${error instanceof Error ? error.message : 'Database error'}`
      };
    }
  },
  zod$({
    firstName: z.string(),
    lastName: z.string(),
    defaultTruck: z.string().optional(),
    endDumpPayRate: z.coerce.number(),
    flatBedPayRate: z.coerce.number(),
    nonCommissionRate: z.coerce.number(),
    dateHired: z.string().optional(),
    dateReleased: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
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

  // Handler to format number inputs to 2 decimal places
  const formatToTwoDecimals = $((event: Event) => {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);
    if (!isNaN(value)) {
      input.value = value.toFixed(2);
    }
  });

  return (
    <section>
      <PageTitle text="New Driver" />

      <div class="mt-3">
        <BackButton />
      </div>

      <div class="card mt-4 max-w-xl">
        <Form
          action={createDriverAction}
          class="flex flex-col gap-4"
        >
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
            onBlur$={formatToTwoDecimals}
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
            onBlur$={formatToTwoDecimals}
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
            onBlur$={formatToTwoDecimals}
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Date Hired</label>
            <input
              name="dateHired"
              type="date"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">Date Released</label>
            <input
              name="dateReleased"
              type="date"
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
          disabled={createDriverAction.isRunning}
        >
          {createDriverAction.isRunning ? 'Creating...' : 'Create Driver'}
        </button>
      </Form>
      </div>

      {createDriverAction.value?.error && (
        <StatusMessage 
          type="error" 
          title="Driver Creation Failed"
          message={createDriverAction.value.error}
          class="mt-4"
        />
      )}
      {createDriverAction.value?.success && (
        <StatusMessage 
          type="success" 
          title="Success!"
          message="Driver created successfully! Redirecting..."
          class="mt-4"
        />
      )}
    </section>
  );
});
