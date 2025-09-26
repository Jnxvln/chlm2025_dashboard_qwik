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
import StatusMessage from '~/components/notifications/StatusMessage';

export const useCreateDriverAction = routeAction$(
  async (data) => {
    console.log('🚀 DRIVER ACTION CALLED!');
    console.log('\nIncoming form data:', data);

    const { dateHired, dateReleased, ...rest } = data;

    try {
      // Convert date strings to Date objects
      const processedDateHired = dateHired ? new Date(dateHired) : null;
      const processedDateReleased = dateReleased ? new Date(dateReleased) : null;

      console.log('🔧 About to create driver with data:', {
        ...rest,
        dateHired: processedDateHired,
        dateReleased: processedDateReleased,
      });

      const driver = await db.driver.create({
        data: {
          ...rest,
          dateHired: processedDateHired,
          dateReleased: processedDateReleased,
        },
      });

      console.log('✅ Driver created successfully:', driver);
      return { success: true, driverId: driver.id };
    } catch (error) {
      console.error('\n❌ Driver creation failed:');
      console.error('Error type:', typeof error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Full error:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      
      return { 
        success: false, 
        error: `Driver creation failed: ${error instanceof Error ? error.message : JSON.stringify(error)}` 
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
    isActive: z.coerce.boolean().optional().default(false),
  }),
);

export default component$(() => {
  const createDriverAction = useCreateDriverAction();
  const nav = useNavigate();

  useVisibleTask$(({ track }) => {
    const result = track(() => createDriverAction.value);
    console.log('🎯 Driver action result:', result);
    if (createDriverAction.value?.success && result?.driverId) {
      console.log('✅ Driver created successfully, redirecting...');
      setTimeout(() => nav(`/drivers?highlight=${result.driverId}`), 1000);
    } else if (createDriverAction.value?.error) {
      console.log('❌ Driver creation failed:', createDriverAction.value.error);
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
        >
          Create Driver
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
