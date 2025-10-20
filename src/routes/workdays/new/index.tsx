// src/routes/workdays/new/index.tsx
import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import {
  // routeLoader$,
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
import {
  useDriversLoader,
  useCurrentUserLoader,
  useDriverParam,
} from '../layout';

export const useCreateWorkdayAction = routeAction$(
  async (values, event) => {
    try {
      // Normalize capitalization before saving (notes, ncReasons, offDutyReason, and checkbox fields are preserved)
      const normalized = normalizeFormData(values, {
        skipFields: ['notes', 'ncReasons', 'offDutyReason', 'offDuty'],
      });

      const workday = await db.workday.create({
        data: {
          date: normalized.date,
          chHours: normalized.chHours,
          ncHours: normalized.ncHours,
          ncReasons: normalized.ncReasons || null,
          notes: normalized.notes || null,
          offDuty: normalized.offDuty,
          offDutyReason: normalized.offDutyReason || null,
          driverId: normalized.driverId,
          createdById: normalized.createdById,
          updatedAt: new Date(),
        },
      });

      // Redirect to returnTo if present
      if (normalized.returnTo && typeof normalized.returnTo === 'string') {
        throw event.redirect(302, normalized.returnTo);
      }

      return { success: true, workdayId: workday.id };
    } catch (error) {
      console.error('Workday creation failed:', error);
      return { success: false, error: 'Failed to create workday' };
    }
  },
  zod$({
    date: z.string().transform((s) => new Date(s + 'T12:00:00Z')),
    chHours: z.coerce.number().min(0),
    ncHours: z.coerce.number().min(0),
    ncReasons: z.string().optional(),
    notes: z.string().optional(),
    offDuty: z.coerce.boolean(),
    offDutyReason: z.string().optional(),
    driverId: z.coerce.number(),
    createdById: z.coerce.number(),
    returnTo: z.string().optional(),
  }),
);

export default component$(() => {
  const drivers = useDriversLoader();
  const driverParam = useDriverParam();
  const currentUser = useCurrentUserLoader();
  const createAction = useCreateWorkdayAction();
  const nav = useNavigate();

  const loc = useLocation();
  const returnToParam = loc.url.searchParams.get('returnTo');

  const isOffDuty = useSignal(false);
  const offDutyReason = useSignal('');
  const showCustomReasonModal = useSignal(false);
  const customReasonType = useSignal<'Holiday' | 'Other'>('Holiday');
  const customReasonInput = useSignal('');

  // Get today's date as default
  const today = new Date().toISOString().split('T')[0];

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
  const handleCustomReasonCancel = $(() => {
    offDutyReason.value = '';
    showCustomReasonModal.value = false;
  });

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    const result = track(() => createAction.value);
    if (createAction.value?.success && result?.workdayId) {
      setTimeout(() => nav(`/workdays?highlight=${result.workdayId}`), 1000);
    }
  });

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
                  handleCustomReasonCancel();
                }
              }}
              autoFocus
            />
          </div>

          <div class="flex justify-end gap-3">
            <button
              class="btn btn-ghost"
              onClick$={handleCustomReasonCancel}
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
        {/* <Link href="/workdays" class="text-blue-500 hover:text-blue-700">
          ← Back to Workdays
        </Link> */}
        {returnToParam && (
          <div class="mb-4">
            <a
              href={returnToParam}
              class="btn btn-ghost btn-sm"
            >
              ← Back to Hauls
            </a>
          </div>
        )}

        <PageTitle text="New Workday" />
      </div>

      <div class="card">
        <Form action={createAction} class="space-y-6">
          <input type="hidden" name="returnTo" value={returnToParam || ''} />

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
                  class="block text-sm font-medium mb-2"
                  style="color: rgb(var(--color-text-secondary))"
                >
                  Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={today}
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
                  value="0"
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
                  value="0"
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
                ></textarea>
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
                ></textarea>
              </div>

              {/* Off Duty Section */}
              <div class="rounded-lg p-4" style="border: 1px solid rgb(var(--color-border)); background-color: rgb(var(--color-bg-secondary))">
                <div class="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="offDuty"
                    name="offDuty"
                    value="true"
                    class="h-4 w-4 rounded"
                    style="accent-color: rgb(var(--color-primary))"
                    onChange$={(_, el) => {
                      isOffDuty.value = el.checked;
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
                    {offDutyReason.value && !offDutyReason.value.startsWith('Holiday:') && !offDutyReason.value.startsWith('Other:') && (
                      <input type="hidden" name="offDutyReason" value={offDutyReason.value} />
                    )}
                    {(offDutyReason.value.startsWith('Holiday:') || offDutyReason.value.startsWith('Other:')) && (
                      <div class="mt-2 p-2 rounded text-sm" style="background-color: rgb(var(--color-bg-tertiary)); color: rgb(var(--color-text-secondary))">
                        {offDutyReason.value}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {createAction.value?.error && (
            <div class="p-3 rounded-lg" style="background-color: rgb(var(--color-danger) / 0.1); color: rgb(var(--color-danger))">
              {createAction.value.error}
            </div>
          )}

          <div class="flex justify-end gap-3">
            <Link
              href="/workdays"
              class="btn btn-ghost"
            >
              Cancel
            </Link>
            <button
              type="submit"
              class="btn btn-primary"
            >
              Create Workday
            </button>
          </div>
        </Form>

        {createAction.value?.success && (
          <div class="mt-4 p-3 rounded-lg" style="background-color: rgb(var(--color-success) / 0.1); color: rgb(var(--color-success))">
            Workday created successfully! Redirecting...
          </div>
        )}
      </div>
    </div>
  );
});
