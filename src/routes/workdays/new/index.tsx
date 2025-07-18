// src/routes/workdays/new/index.tsx
import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import {
  routeLoader$,
  routeAction$,
  Form,
  Link,
  zod$,
  z,
  useNavigate,
} from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import PageTitle from '~/components/PageTitle';
import {
  useDriversLoader,
  useCurrentUserLoader,
  useDriverParam,
} from '../layout';

export const useCreateWorkdayAction = routeAction$(
  async (data) => {
    try {
      const workday = await db.workday.create({
        data: {
          date: data.date,
          chHours: data.chHours,
          ncHours: data.ncHours,
          ncReasons: data.ncReasons || null,
          notes: data.notes || null,
          offDuty: data.offDuty,
          offDutyReason: data.offDutyReason || null,
          driverId: data.driverId,
          createdById: data.createdById,
          updatedAt: new Date(),
        },
      });

      return { success: true, workdayId: workday.id };
    } catch (error) {
      console.error('Workday creation failed:', error);
      return { success: false, error: 'Failed to create workday' };
    }
  },
  zod$({
    date: z.string().transform((s) => new Date(s)),
    chHours: z.coerce.number().min(0),
    ncHours: z.coerce.number().min(0),
    ncReasons: z.string().optional(),
    notes: z.string().optional(),
    offDuty: z.coerce.boolean(),
    offDutyReason: z.string().optional(),
    driverId: z.coerce.number(),
    createdById: z.coerce.number(),
  }),
);

export default component$(() => {
  const drivers = useDriversLoader();
  const driverParam = useDriverParam();
  const currentUser = useCurrentUserLoader();
  const createAction = useCreateWorkdayAction();
  const nav = useNavigate();

  const isOffDuty = useSignal(false);

  // Get today's date as default
  const today = new Date().toISOString().split('T')[0];

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    const result = track(() => createAction.value);
    if (createAction.value?.success && result?.workdayId) {
      setTimeout(() => nav(`/workdays?highlight=${result.workdayId}`), 1000);
    }
  });

  return (
    <div class="container mx-auto p-6 max-w-2xl">
      <div class="mb-6">
        <Link href="/workdays" class="text-blue-500 hover:text-blue-700">
          ← Back to Workdays
        </Link>
        <PageTitle text="New Workday" />
      </div>

      <div class="bg-white shadow-md rounded-lg p-6">
        <Form action={createAction}>
          {/* Hidden field for current user */}
          <input
            type="hidden"
            name="createdById"
            value={currentUser.value?.id}
          />

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div class="space-y-4">
              <div>
                <label
                  for="date"
                  class="block text-sm font-medium text-gray-700 mb-2"
                >
                  Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={today}
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  for="driverId"
                  class="block text-sm font-medium text-gray-700 mb-2"
                >
                  Driver *
                </label>
                <select
                  id="driverId"
                  name="driverId"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  // value={drivers.value.currentDriver?.toString() ?? ''}
                  value={driverParam.value}
                  onChange$={(_, el) => {
                    const url = new URL(window.location.href);
                    if (el.value) url.searchParams.set('driver', el.value);
                    else url.searchParams.delete('driver');
                    nav(url.pathname + '?' + url.searchParams.toString());
                  }}
                >
                  <option value="">All Drivers</option>
                  {drivers.value.map((driver) => (
                    <option key={driver.id} value={driver.id.toString()}>
                      {`${driver.firstName} ${driver.lastName}${driver.defaultTruck ? ` - ${driver.defaultTruck}` : ''}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  for="chHours"
                  class="block text-sm font-medium text-gray-700 mb-2"
                >
                  Commission Hours *
                </label>
                <input
                  type="number"
                  id="chHours"
                  name="chHours"
                  min="0"
                  step="0.25"
                  value="0"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="8.00"
                />
              </div>

              <div>
                <label
                  for="ncHours"
                  class="block text-sm font-medium text-gray-700 mb-2"
                >
                  Non-Commission Hours *
                </label>
                <input
                  type="number"
                  id="ncHours"
                  name="ncHours"
                  min="0"
                  step="0.25"
                  value="0"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label
                  for="ncReasons"
                  class="block text-sm font-medium text-gray-700 mb-2"
                >
                  Non-Commission Reasons
                </label>
                <textarea
                  id="ncReasons"
                  name="ncReasons"
                  rows={2}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Reason for non-commission hours..."
                ></textarea>
              </div>
            </div>

            {/* Right Column */}
            <div class="space-y-4">
              <div>
                <label
                  for="notes"
                  class="block text-sm font-medium text-gray-700 mb-2"
                >
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any additional notes for this workday..."
                ></textarea>
              </div>

              {/* Off Duty Section */}
              <div class="border rounded-lg p-4 bg-gray-50">
                <div class="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="offDuty"
                    name="offDuty"
                    value="true"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    onChange$={(_, el) => {
                      isOffDuty.value = el.checked;
                    }}
                  />
                  <label
                    for="offDuty"
                    class="ml-2 block text-sm font-medium text-gray-700"
                  >
                    Driver was off duty
                  </label>
                </div>

                {isOffDuty.value && (
                  <div>
                    <label
                      for="offDutyReason"
                      class="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Off Duty Reason
                    </label>
                    <textarea
                      id="offDutyReason"
                      name="offDutyReason"
                      rows={2}
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Reason for being off duty..."
                    ></textarea>
                  </div>
                )}
              </div>
            </div>
          </div>

          {createAction.value?.error && (
            <div class="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {createAction.value.error}
            </div>
          )}

          <div class="flex justify-end space-x-4 mt-6">
            <Link
              href="/workdays"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Create Workday
            </button>
          </div>
        </Form>

        {createAction.value?.success && (
          <div class="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            Workday created successfully! Redirecting...
          </div>
        )}
      </div>
    </div>
  );
});
