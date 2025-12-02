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
import { normalizeFormData } from '~/lib/text-utils';
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
  async (values, event) => {
    try {
      // Normalize capitalization before saving (notes, ncReasons, offDutyReason, and checkbox fields are preserved)
      const normalized = normalizeFormData(values, {
        skipFields: ['notes', 'ncReasons', 'offDutyReason', 'offDuty'],
      });

      // If marking as off-duty, delete all associated hauls first
      if (normalized.offDuty) {
        await db.haul.deleteMany({
          where: { workdayId: Number(normalized.id) },
        });
      }

      const workday = await db.workday.update({
        where: { id: Number(normalized.id) },
        data: {
          date: normalized.date,
          chHours: normalized.chHours,
          ncHours: normalized.ncHours,
          ncReasons: normalized.ncReasons || null,
          notes: normalized.notes || null,
          offDuty: normalized.offDuty,
          offDutyReason: normalized.offDutyReason || null,
          offDutyReasonHoliday: normalized.offDutyReasonHoliday || null,
          offDutyReasonOther: normalized.offDutyReasonOther || null,
          driverId: normalized.driverId,
          updatedAt: new Date(),
        },
      });

      // Redirect to returnTo if present
      if (normalized.returnTo && typeof normalized.returnTo === 'string') {
        throw event.redirect(302, normalized.returnTo);
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
    offDutyReasonHoliday: z.string().optional(),
    offDutyReasonOther: z.string().optional(),
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
  const showCustomReasonModal = useSignal(false);
  // Initialize custom reason signals with existing data
  const initialCustomType = workday.value.offDutyReason === 'Holiday' ? 'Holiday' : workday.value.offDutyReason === 'Other' ? 'Other' : 'Holiday';
  const initialCustomText = workday.value.offDutyReason === 'Holiday' ? (workday.value.offDutyReasonHoliday || '') : workday.value.offDutyReason === 'Other' ? (workday.value.offDutyReasonOther || '') : '';
  
  const customReasonType = useSignal<'Holiday' | 'Other'>(initialCustomType);
  const customReasonInput = useSignal(initialCustomText);
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

  // Handler for off-duty reason change
  const handleOffDutyReasonChange = $((value: string) => {
    if (value === 'Holiday' || value === 'Other') {
      customReasonType.value = value;
      customReasonInput.value = '';
      showCustomReasonModal.value = true;
    } else {
      offDutyReason.value = value;
    }
  });

  // Handler for custom reason modal confirmation
  const handleCustomReasonConfirm = $(() => {
    const customText = customReasonInput.value.trim();
    if (customText) {
      offDutyReason.value = `${customReasonType.value}: ${customText}`;
    } else {
      offDutyReason.value = customReasonType.value;
    }
    showCustomReasonModal.value = false;
  });

  // Handler for custom reason modal cancel
  const handleCustomReasonModalCancel = $(() => {
    showCustomReasonModal.value = false;
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

  // Show custom reason modal
  if (showCustomReasonModal.value) {
    return (
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="card max-w-lg w-full mx-4">
          <h2 class="text-xl font-bold mb-4" style="color: rgb(var(--color-text-primary))">
            {customReasonType.value === 'Holiday' ? 'Which Holiday?' : 'Enter Custom Reason'}
          </h2>
          <p class="mb-4" style="color: rgb(var(--color-text-secondary))">
            {customReasonType.value === 'Holiday'
              ? 'Please specify which holiday (e.g., Christmas, Thanksgiving, etc.)'
              : 'Please enter a custom reason. Keep it brief.'}
          </p>

          <div class="mb-4">
            <input
              type="text"
              class="w-full"
              placeholder={customReasonType.value === 'Holiday' ? 'e.g., Christmas' : 'e.g., Family emergency'}
              value={customReasonInput.value}
              onInput$={(_, el) => {
                customReasonInput.value = el.value;
              }}
              onKeyDown$={(e) => {
                if (e.key === 'Enter' && customReasonInput.value.trim()) {
                  handleCustomReasonConfirm();
                } else if (e.key === 'Escape') {
                  handleCustomReasonModalCancel();
                }
              }}
              autoFocus
            />
          </div>

          <div class="flex justify-end gap-3">
            <button
              class="btn btn-ghost"
              onClick$={handleCustomReasonModalCancel}
            >
              Cancel
            </button>
            <button
              class="btn btn-primary"
              onClick$={handleCustomReasonConfirm}
              disabled={!customReasonInput.value.trim()}
            >
              Confirm
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
                      id="offDutyReasonSelect"
                      class="w-full"
                      required
                      value={offDutyReason.value.startsWith('Holiday') ? 'Holiday' : offDutyReason.value.startsWith('Other') ? 'Other' : offDutyReason.value}
                      onChange$={(_, el) => {
                        handleOffDutyReasonChange(el.value);
                      }}
                    >
                      <option value="">Select reason...</option>
                      <option value="No Work">No Work</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Sick">Sick</option>
                      <option value="Holiday">Holiday</option>
                      <option value="Vacation">Vacation</option>
                      <option value="Weather">Weather</option>
                      <option value="Personal">Personal</option>
                      <option value="Bereavement">Bereavement</option>
                      <option value="Other">Other</option>
                    </select>
                    <input type="hidden" name="offDutyReason" value={offDutyReason.value} />
                    <input type="hidden" name="offDutyReasonHoliday" value={customReasonType.value === 'Holiday' ? customReasonInput.value : ''} />
                    <input type="hidden" name="offDutyReasonOther" value={customReasonType.value === 'Other' ? customReasonInput.value : ''} />
                    {(customReasonType.value === 'Holiday' || customReasonType.value === 'Other') && customReasonInput.value && (
                      <div class="mt-2 p-2 rounded text-sm" style="background-color: rgb(var(--color-bg-tertiary)); color: rgb(var(--color-text-secondary))">
                        {customReasonType.value}: {customReasonInput.value}
                      </div>
                    )}
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
