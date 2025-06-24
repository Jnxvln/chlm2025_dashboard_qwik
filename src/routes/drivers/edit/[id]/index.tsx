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
      await db.driver.update({
        where: { id },
        data: {
          ...rest,
          dateHired: dateHired || null,
          dateReleased: dateReleased || null,
        },
      });

      // return { success: true };
      return { success: true, driverId: data.id };
    } catch (err) {
      console.error('Update failed', err);
      return { success: false, error: 'Update failed' };
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
    <section class='max-w-3xl mx-auto px-4 py-6'>
      <PageTitle text='Edit Driver' />

      <div class='mt-3'>
        <BackButton />
      </div>

      <Form
        action={updateDriver}
        class='mt-4 flex flex-col gap-4 bg-white border border-gray-200 shadow p-6 rounded-lg'
      >
        <div class='flex gap-4'>
          <input
            name='firstName'
            type='text'
            value={driver.value.firstName}
            required
            placeholder='First Name'
            class='w-full border border-gray-300 rounded p-2'
          />
          <input
            name='lastName'
            type='text'
            value={driver.value.lastName}
            required
            placeholder='Last Name'
            class='w-full border border-gray-300 rounded p-2'
          />
        </div>

        <input
          name='defaultTruck'
          type='text'
          value={driver.value.defaultTruck ?? ''}
          placeholder='Default Truck'
          class='w-full border border-gray-300 rounded p-2'
        />

        <input
          name='endDumpPayRate'
          type='number'
          step='0.01'
          value={driver.value.endDumpPayRate}
          placeholder='End Dump Pay Rate'
          class='w-full border border-gray-300 rounded p-2'
        />

        <input
          name='flatBedPayRate'
          type='number'
          step='0.01'
          value={driver.value.flatBedPayRate}
          placeholder='Flatbed Pay Rate'
          class='w-full border border-gray-300 rounded p-2'
        />

        <input
          name='nonCommissionRate'
          type='number'
          step='0.01'
          value={driver.value.nonCommissionRate}
          placeholder='Non-Commission Rate'
          class='w-full border border-gray-300 rounded p-2'
        />

        <div class='flex gap-4'>
          <input
            name='dateHired'
            type='datetime-local'
            value={
              driver.value.dateHired
                ? new Date(driver.value.dateHired).toISOString().slice(0, 16)
                : ''
            }
            class='w-full border border-gray-300 rounded p-2'
          />
          <input
            name='dateReleased'
            type='datetime-local'
            value={
              driver.value.dateReleased
                ? new Date(driver.value.dateReleased).toISOString().slice(0, 16)
                : ''
            }
            class='w-full border border-gray-300 rounded p-2'
          />
        </div>

        <label class='inline-flex items-center gap-2 mt-2'>
          <input
            name='isActive'
            type='checkbox'
            value='true'
            checked={driver.value.isActive}
            class='accent-emerald-600'
          />
          <span>Is Active</span>
        </label>

        <button
          type='submit'
          class='bg-emerald-600 text-white px-6 py-2 rounded hover:bg-emerald-700 transition-colors'
        >
          Update Driver
        </button>

        {updateDriver.value?.error && (
          <p class='text-red-600 font-medium'>{updateDriver.value.error}</p>
        )}
        {success.value && (
          <p class='text-green-600 font-medium'>
            Driver updated! Redirecting...
          </p>
        )}
      </Form>
    </section>
  );
});
