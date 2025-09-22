import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import {
  routeLoader$,
  routeAction$,
  Form,
  Link,
  zod$,
  z,
  useNavigate,
  useLocation,
} from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import PageTitle from '~/components/PageTitle';
import { useDriversLoader, useCurrentUserLoader } from '../../layout';

export const useWorkdayLoader = routeLoader$(async ({ params, redirect }) => {
  const workday = await db.workday.findUnique({
    where: { id: Number(params.id) },
    include: { driver: true },
  });

  if (!workday) {
    throw redirect(302, '/workdays');
  }

  return workday;
});

export const useUpdateWorkdayAction = routeAction$(
  async (data, event) => {
    try {
      const workday = await db.workday.update({
        where: { id: Number(data.id) },
        data: {
          date: data.date,
          chHours: data.chHours,
          ncHours: data.ncHours,
          ncReasons: data.ncReasons || null,
          notes: data.notes || null,
          offDuty: data.offDuty,
          offDutyReason: data.offDutyReason || null,
          driverId: data.driverId,
          updatedAt: new Date(),
        },
      });

      // Redirect to returnTo if present
      if (data.returnTo && typeof data.returnTo === 'string') {
        throw event.redirect(302, data.returnTo);
      }

      return { success: true, workdayId: workday.id };
    } catch (error) {
      console.error('Workday update failed:', error);
      return { success: false, error: 'Failed to update workday' };
    }
  },
  zod$({
    id: z.coerce.number(),
    date: z.string().transform((s) => new Date(s)),
    chHours: z.coerce.number().min(0),
    ncHours: z.coerce.number().min(0),
    ncReasons: z.string().optional(),
    notes: z.string().optional(),
    offDuty: z.coerce.boolean(),
    offDutyReason: z.string().optional(),
    driverId: z.coerce.number(),
    returnTo: z.string().optional(),
  }),
);

export default component$(() => {
  const workday = useWorkdayLoader();
  const drivers = useDriversLoader();
  const currentUser = useCurrentUserLoader();
  const updateAction = useUpdateWorkdayAction();
  const nav = useNavigate();
  const loc = useLocation();

  // const backUrl = `/workdays${loc.url.search}`; // preserves ?driver=...&startDate=...&endDate=...
  const returnToParam = loc.url.searchParams.get('returnTo');
  const decodedReturnTo = returnToParam ? decodeURIComponent(returnToParam) : null;
  const backUrl = decodedReturnTo || `/workdays${loc.url.search}`;

  const isOffDuty = useSignal(workday.value.offDuty || false);
  const dateValue = new Date(workday.value.date).toISOString().split('T')[0];

  useVisibleTask$(({ track }) => {
    const result = track(() => updateAction.value);
    if (updateAction.value?.success && result?.workdayId) {
      setTimeout(() => nav(`/workdays?highlight=${result.workdayId}`), 1000);
    }
  });

  return (
    <div class="container mx-auto p-6 max-w-2xl">
      <div class="mb-6">
        <Link href={backUrl} class="text-blue-500 hover:text-blue-700">
          ← Back to {returnToParam ? 'Hauls' : 'Workdays'}
        </Link>
        <PageTitle text="Edit Workday" />
      </div>

      <div class="bg-white shadow-md rounded-lg p-6">
        <Form action={updateAction}>
          <input type="hidden" name="id" value={workday.value.id} />
          <input type="hidden" name="returnTo" value={decodedReturnTo || ''} />

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  value={dateValue}
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
                >
                  <option value="">Select a driver</option>
                  {drivers.value.map((driver) => (
                    <option key={driver.id} value={driver.id.toString()} selected={driver.id === workday.value.driverId}>
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
                  C&H Hours *
                </label>
                <input
                  type="number"
                  id="chHours"
                  name="chHours"
                  min="0"
                  step="0.25"
                  value={workday.value.chHours.toString()}
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
                  value={workday.value.ncHours.toString()}
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
                >
                  {workday.value.ncReasons || ''}
                </textarea>
              </div>
            </div>

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
                >
                  {workday.value.notes || ''}
                </textarea>
              </div>

              <div class="border rounded-lg p-4 bg-gray-50">
                <div class="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="offDuty"
                    name="offDuty"
                    value="true"
                    checked={isOffDuty.value}
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
                    >
                      {workday.value.offDutyReason || ''}
                    </textarea>
                  </div>
                )}
              </div>
            </div>
          </div>

          {updateAction.value?.error && (
            <div class="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {updateAction.value.error}
            </div>
          )}

          <div class="flex justify-end space-x-4 mt-6">
            <Link
              href={backUrl}
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Update Workday
            </button>
          </div>
        </Form>

        {updateAction.value?.success && (
          <div class="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            Workday updated successfully! Redirecting...
          </div>
        )}
      </div>
    </div>
  );
});
