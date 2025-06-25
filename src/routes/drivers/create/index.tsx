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

      <Form action={createDriverAction} class="mt-4 flex flex-col max-w-xl">
        <div class="flex my-2 items-center gap-2">
          <input
            name="firstName"
            type="text"
            placeholder="First Name *"
            required
          />
          <input
            name="lastName"
            type="text"
            placeholder="Last Name *"
            required
          />
          <input name="defaultTruck" type="text" placeholder="Truck #" />
        </div>

        <input
          name="endDumpPayRate"
          type="number"
          min={0}
          step={0.01}
          placeholder="End Dump Pay Rate *"
          class="my-2"
          required
        />
        <input
          name="flatBedPayRate"
          type="number"
          min={0}
          step={0.01}
          placeholder="Flatbed Pay Rate *"
          class="my-2"
          required
        />
        <input
          name="nonCommissionRate"
          type="number"
          min={0}
          step={0.01}
          placeholder="Non-commission Rate *"
          class="my-2"
          required
        />

        <div class="flex my-2 items-center gap-2">
          <input
            name="dateHired"
            type="datetime-local"
            placeholder="Date Hired"
          />
          <input
            name="dateReleased"
            type="datetime-local"
            placeholder="Date Released"
          />
        </div>

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

      {createDriverAction.value?.error ? (
        <div>
          <strong class="font-bold text-red-500">Error: </strong>
          <span>{createDriverAction.value.error}</span>
        </div>
      ) : createDriverAction.value?.success ? (
        <div class="text-foreground">
          <strong class="font-bold text-green-500">
            Driver created! <span>Redirecting...</span>
          </strong>
        </div>
      ) : (
        <div></div>
      )}
    </section>
  );
});
