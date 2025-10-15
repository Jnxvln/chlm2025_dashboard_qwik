import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
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
import { useDriversLoader } from '../../layout';

export const useWorkdayLoader = routeLoader$(async ({ params, redirect }) => {
  const workday = await db.workday.findUnique({
    where: { id: Number(params.id) },
    include: {
      driver: true,
      hauls: true, // Include hauls to check if workday has associated hauls
    },
  });

  if (!workday) {
    throw redirect(302, '/workdays');
  }

  return workday;
});

export const useUpdateWorkdayAction = routeAction$(
  async (data, event) => {
    try {
      // If marking as off-duty, delete all associated hauls first
      if (data.offDuty) {
        await db.haul.deleteMany({
          where: { workdayId: Number(data.id) },
        });
      }

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
    date: z.string().transform((s) => new Date(s + 'T12:00:00Z')),
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
  // const currentUser = useCurrentUserLoader();
  const updateAction = useUpdateWorkdayAction();
  const nav = useNavigate();
  const loc = useLocation();

  // const backUrl = `/workdays${loc.url.search}`; // preserves ?driver=...&startDate=...&endDate=...
  const returnToParam = loc.url.searchParams.get('returnTo');
  const decodedReturnTo = returnToParam ? decodeURIComponent(returnToParam) : null;
  const backUrl = decodedReturnTo || `/workdays${loc.url.search}`;

  const isOffDuty = useSignal(workday.value.offDuty || false);
  const offDutyReason = useSignal(workday.value.offDutyReason || '');
  const showDeleteHaulsModal = useSignal(false);
  const dateValue = new Date(workday.value.date).toISOString().split('T')[0];

  // Handler for off-duty checkbox change
  const handleOffDutyChange = $((checked: boolean) => {
    // If checking and there are hauls, show deletion modal
    if (checked && workday.value.hauls && workday.value.hauls.length > 0) {
      showDeleteHaulsModal.value = true;
      return; // Don't change checkbox yet
    }

    // If unchecking, just uncheck
    isOffDuty.value = checked;
    if (!checked) {
      offDutyReason.value = ''; // Clear reason when unchecking
    }
  });

  // Handler for modal confirmation
  const handleDeleteHaulsConfirm = $(() => {
    // Mark as off-duty and close modal
    // The backend will delete hauls when the form is submitted
    isOffDuty.value = true;
    showDeleteHaulsModal.value = false;
  });

  // Handler for modal cancel
  const handleDeleteHaulsCancel = $(() => {
    showDeleteHaulsModal.value = false;
  });

  useVisibleTask$(({ track }) => {
    const result = track(() => updateAction.value);
    if (updateAction.value?.success && result?.workdayId) {
      setTimeout(() => nav(`/workdays?highlight=${result.workdayId}`), 1000);
    }
  });

  // Show delete hauls modal
  if (showDeleteHaulsModal.value) {
    const haulCount = workday.value.hauls?.length || 0;

    return (
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="card max-w-lg w-full mx-4">
          <h2 class="text-xl font-bold mb-4" style="color: rgb(var(--color-text-primary))">
            Delete Hauls to Mark Off Duty?
          </h2>
          <p class="mb-4" style="color: rgb(var(--color-text-secondary))">
            This workday has <strong>{haulCount}</strong> haul{haulCount !== 1 ? 's' : ''} that will be deleted if you mark this day as off-duty.
          </p>

          {/* List hauls */}
          <div class="mb-4 max-h-48 overflow-y-auto">
            <ul class="space-y-2">
              {(workday.value.hauls || []).map((haul: any) => (
                <li key={haul.id} class="p-2 rounded" style="background-color: rgb(var(--color-bg-secondary))">
                  <div class="font-medium">{haul.customer}</div>
                  <div class="text-sm" style="color: rgb(var(--color-text-tertiary))">
                    {haul.loadRefNum ? `Ref: ${haul.loadRefNum}` : 'No ref number'} • {haul.quantity}t @ ${haul.rate}/t
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div class="flex justify-end gap-3">
            <button
              class="btn btn-ghost"
              onClick$={handleDeleteHaulsCancel}
            >
              Cancel
            </button>
            <button
              class="btn btn-danger"
              onClick$={handleDeleteHaulsConfirm}
            >
              Delete Hauls & Mark Off Duty
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class="container mx-auto p-6 max-w-2xl">
      <div class="mb-6">
        {returnToParam && (
          <div class="mb-4">
            <a
              href={backUrl}
              class="btn btn-ghost btn-sm"
            >
              ← Back to Hauls
            </a>
          </div>
        )}

        <PageTitle text="Edit Workday" />
      </div>

      <div class="card">
        <Form action={updateAction}>
          <input type="hidden" name="id" value={workday.value.id} />
          <input type="hidden" name="returnTo" value={decodedReturnTo || ''} />

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div class="space-y-4">
              <div>
                <label
                  for="date"
                  class="block text-sm font-medium mb-2"
                  style="color: rgb(var(--color-text-secondary))"
                >
                  Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={dateValue}
                  required
                  class="w-full"
                />
              </div>

              <div>
                <label
                  for="driverId"
                  class="block text-sm font-medium mb-2"
                  style="color: rgb(var(--color-text-secondary))"
                >
                  Driver *
                </label>
                <select
                  id="driverId"
                  name="driverId"
                  required
                  class="w-full"
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
                  class="block text-sm font-medium mb-2"
                  style="color: rgb(var(--color-text-secondary))"
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
                  class="w-full"
                  placeholder="8.00"
                />
              </div>

              <div>
                <label
                  for="ncHours"
                  class="block text-sm font-medium mb-2"
                  style="color: rgb(var(--color-text-secondary))"
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
                  class="w-full"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label
                  for="ncReasons"
                  class="block text-sm font-medium mb-2"
                  style="color: rgb(var(--color-text-secondary))"
                >
                  Non-Commission Reasons
                </label>
                <textarea
                  id="ncReasons"
                  name="ncReasons"
                  rows={2}
                  class="w-full"
                  placeholder="Reason for non-commission hours..."
                >
                  {workday.value.ncReasons || ''}
                </textarea>
              </div>
            </div>

            {/* Right Column */}
            <div class="space-y-4">
              <div>
                <label
                  for="notes"
                  class="block text-sm font-medium mb-2"
                  style="color: rgb(var(--color-text-secondary))"
                >
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  class="w-full"
                  placeholder="Any additional notes for this workday..."
                >
                  {workday.value.notes || ''}
                </textarea>
              </div>

              {/* Off Duty Section */}
              <div class="rounded-lg p-4" style="border: 1px solid rgb(var(--color-border)); background-color: rgb(var(--color-bg-secondary))">
                <div class="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="offDuty"
                    name="offDuty"
                    value="true"
                    checked={isOffDuty.value}
                    class="h-4 w-4 rounded"
                    style="accent-color: rgb(var(--color-primary))"
                    onChange$={(_, el) => {
                      handleOffDutyChange(el.checked);
                    }}
                  />
                  <label
                    for="offDuty"
                    class="ml-2 block text-sm font-medium"
                    style="color: rgb(var(--color-text-primary))"
                  >
                    Driver was off duty
                  </label>
                </div>

                {isOffDuty.value && (
                  <div>
                    <label
                      for="offDutyReason"
                      class="block text-sm font-medium mb-2"
                      style="color: rgb(var(--color-text-secondary))"
                    >
                      Off Duty Reason *
                    </label>
                    <select
                      id="offDutyReason"
                      name="offDutyReason"
                      class="w-full"
                      required
                      value={offDutyReason.value}
                      onChange$={(_, el) => {
                        offDutyReason.value = el.value;
                      }}
                    >
                      <option value="" selected={offDutyReason.value === ''}>Select reason...</option>
                      <option value="No Work" selected={offDutyReason.value === 'No Work'}>No Work</option>
                      <option value="Maintenance" selected={offDutyReason.value === 'Maintenance'}>Maintenance</option>
                      <option value="Sick" selected={offDutyReason.value === 'Sick'}>Sick</option>
                      <option value="Holiday" selected={offDutyReason.value === 'Holiday'}>Holiday</option>
                      <option value="Vacation" selected={offDutyReason.value === 'Vacation'}>Vacation</option>
                      <option value="Weather" selected={offDutyReason.value === 'Weather'}>Weather</option>
                      <option value="Personal" selected={offDutyReason.value === 'Personal'}>Personal</option>
                      <option value="Bereavement" selected={offDutyReason.value === 'Bereavement'}>Bereavement</option>
                      <option value="Other" selected={offDutyReason.value === 'Other'}>Other</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {updateAction.value?.error && (
            <div class="p-3 rounded-lg" style="background-color: rgb(var(--color-danger) / 0.1); color: rgb(var(--color-danger))">
              {updateAction.value.error}
            </div>
          )}

          <div class="flex justify-end gap-3">
            <Link
              href={backUrl}
              class="btn btn-ghost"
            >
              Cancel
            </Link>
            <button
              type="submit"
              class="btn btn-primary"
            >
              Update Workday
            </button>
          </div>
        </Form>

        {updateAction.value?.success && (
          <div class="mt-4 p-3 rounded-lg" style="background-color: rgb(var(--color-success) / 0.1); color: rgb(var(--color-success))">
            Workday updated successfully! Redirecting...
          </div>
        )}
      </div>
    </div>
  );
});
