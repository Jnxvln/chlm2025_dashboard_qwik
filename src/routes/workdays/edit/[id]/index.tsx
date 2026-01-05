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
import type { NcItemDraft } from '~/utils/nonCommUtils';
import { getDefaultRate, parseNcItemsJson } from '~/utils/nonCommUtils';
import { db } from '~/lib/db';
import { normalizeFormData } from '~/lib/text-utils';
import PageTitle from '~/components/PageTitle';
import { useDriversLoader, useSettingsLoader } from '../../layout';

export const useWorkdayLoader = routeLoader$(async ({ params, redirect }) => {
  const workday = await db.workday.findUnique({
    where: { id: Number(params.id) },
    include: {
      driver: true,
      hauls: true,
      ncItems: true,
    },
  });

  if (!workday) {
    throw redirect(302, '/workdays');
  }

  return {
    ...workday,
    ncItems: workday.ncItems.map((i) => ({
      ...i,
      rate: i.rate == null ? null : Number(i.rate.toString()),
    })),
  };
});

export const useUpdateWorkdayAction = routeAction$(
  async (values, event) => {
    try {
      // Normalize capitalization before saving (notes, ncReasons, offDutyReason, and checkbox fields are preserved)
      const normalized = normalizeFormData(values, {
        skipFields: ['notes', 'ncReasons', 'offDutyReason', 'offDuty'],
      });

      const items = parseNcItemsJson(values.ncItemsJson);
      const cachedNcHours = items.reduce(
        (sum, i) => sum + (Number.isFinite(i.hours) ? i.hours : 0),
        0,
      );

      // If marking as off-duty, delete all associated hauls first
      if (normalized.offDuty) {
        await db.haul.deleteMany({
          where: { workdayId: Number(normalized.id) },
        });
      }

      // const workday = await db.workday.update({
      //   where: { id: Number(normalized.id) },
      //   data: {
      //     date: normalized.date,
      //     chHours: normalized.chHours,
      //     ncHours: normalized.ncHours,
      //     ncReasons: normalized.ncReasons || null,
      //     notes: normalized.notes || null,
      //     offDuty: normalized.offDuty,
      //     offDutyReason: normalized.offDutyReason || null,
      //     offDutyReasonHoliday: normalized.offDutyReasonHoliday || null,
      //     offDutyReasonOther: normalized.offDutyReasonOther || null,
      //     driverId: normalized.driverId,
      //     updatedAt: new Date(),
      //   },
      // });
      const workday = await db.$transaction(async (tx) => {
        // If marking as off-duty, delete associated hauls + ncItems
        if (normalized.offDuty) {
          await tx.haul.deleteMany({
            where: { workdayId: Number(normalized.id) },
          });
          await tx.ncItem.deleteMany({
            where: { workdayId: Number(normalized.id) },
          });
        } else {
          // Not off-duty -> replace ncItems with submitted list
          await tx.ncItem.deleteMany({
            where: { workdayId: Number(normalized.id) },
          });

          if (items.length) {
            await tx.ncItem.createMany({
              data: items.map((i) => ({
                workdayId: Number(normalized.id),
                description: i.description,
                hours: i.hours,
                rate: i.rate ?? null,
              })),
            });
          }
        }

        return tx.workday.update({
          where: { id: Number(normalized.id) },
          data: {
            date: normalized.date,
            chHours: normalized.chHours,
            ncHours: normalized.offDuty ? 0 : cachedNcHours, // cache (legacy)
            // ncReasons: normalized.ncReasons || null, // legacy (optional)
            notes: normalized.notes || null,
            offDuty: normalized.offDuty,
            offDutyReason: normalized.offDutyReason || null,
            offDutyReasonHoliday: normalized.offDutyReasonHoliday || null,
            offDutyReasonOther: normalized.offDutyReasonOther || null,
            driverId: normalized.driverId,
            updatedAt: new Date(),
          },
        });
      });

      // Redirect to returnTo if present
      if (normalized.returnTo && typeof normalized.returnTo === 'string') {
        throw event.redirect(302, normalized.returnTo);
      }

      return { success: true, workdayId: workday.id };
    } catch (error) {
      console.error('Workday update failed:', error);
      return {
        error: `Failed to update workday: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
  zod$({
    id: z.coerce.number(),
    date: z.string().transform((s) => new Date(s + 'T12:00:00Z')),
    chHours: z.coerce.number().min(0),
    ncItemsJson: z.string().optional(),
    // ncReasons: z.string().optional(), // legacy
    // ncHours: z.coerce.number().min(0), // legacy
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
  const settings = useSettingsLoader();
  // const currentUser = useCurrentUserLoader();
  const updateAction = useUpdateWorkdayAction();
  const nav = useNavigate();
  const loc = useLocation();

  // const backUrl = `/workdays${loc.url.search}`; // preserves ?driver=...&startDate=...&endDate=...
  const returnToParam = loc.url.searchParams.get('returnTo');
  const decodedReturnTo = returnToParam
    ? decodeURIComponent(returnToParam)
    : null;
  const backUrl = decodedReturnTo || `/workdays${loc.url.search}`;

  const isOffDuty = useSignal(workday.value.offDuty || false);
  const offDutyReason = useSignal(workday.value.offDutyReason || '');
  const showDeleteHaulsModal = useSignal(false);
  const showCustomReasonModal = useSignal(false);
  // Initialize custom reason signals with existing data
  const initialCustomType =
    workday.value.offDutyReason === 'Holiday'
      ? 'Holiday'
      : workday.value.offDutyReason === 'Other'
        ? 'Other'
        : 'Holiday';
  const initialCustomText =
    workday.value.offDutyReason === 'Holiday'
      ? workday.value.offDutyReasonHoliday || ''
      : workday.value.offDutyReason === 'Other'
        ? workday.value.offDutyReasonOther || ''
        : '';

  const customReasonType = useSignal<'Holiday' | 'Other'>(initialCustomType);
  const customReasonInput = useSignal(initialCustomText);
  const dateValue = new Date(workday.value.date).toISOString().split('T')[0];
  const chHoursInput = useSignal<string>(
    Number(workday.value.chHours ?? 0).toFixed(2),
  );

  // Hyrdate ncItems table from DB
  const ncItems = useSignal<NcItemDraft[]>(
    (workday.value.ncItems || []).map((i: any) => ({
      id: i.id,
      description: i.description ?? '',
      hours: Number(i.hours ?? 0),
      rate: i.rate == null ? null : Number(i.rate),
    })),
  );

  const selectedDriverId = useSignal<string>(
    String(workday.value.driverId ?? ''),
  );

  // Pre-convert settings rate outside $ scope
  const precomputedSettingsRate =
    settings.value?.driverDefaultNCPayRate ?? null;

  const addNcItem = $(async () => {
    const defaultRate = await getDefaultRate(
      drivers.value,
      selectedDriverId.value || '',
      precomputedSettingsRate,
    );
    ncItems.value = [
      ...ncItems.value,
      { description: '', hours: 0, rate: defaultRate },
    ];
  });

  const removeNcItem = $((idx: number) => {
    ncItems.value = ncItems.value.filter((_, i) => i !== idx);
  });

  const updateNcItem = $((idx: number, patch: Partial<NcItemDraft>) => {
    const copy = ncItems.value.slice();
    copy[idx] = { ...copy[idx], ...patch };
    ncItems.value = copy;
  });

  // Handler for off-duty checkbox change
  const handleOffDutyChange = $((checked: boolean) => {
    // If checking and there are hauls, show deletion modal
    if (checked && workday.value.hauls && workday.value.hauls.length > 0) {
      showDeleteHaulsModal.value = true;
      return;
    }

    // If unchecking, just uncheck
    isOffDuty.value = checked;
    if (checked) ncItems.value = [];
    else offDutyReason.value = '';
  });

  // Handler for modal confirmation
  const handleDeleteHaulsConfirm = $(() => {
    // Mark as off-duty and close modal
    // The backend will delete hauls when the form is submitted
    isOffDuty.value = true;
    ncItems.value = [];
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
    // const customText = customReasonInput.value.trim();
    // if (customText) {
    //   offDutyReason.value = `${customReasonType.value}: ${customText}`;
    // } else {
    //   offDutyReason.value = customReasonType.value;
    // }
    // showCustomReasonModal.value = false;
    offDutyReason.value = customReasonType.value;
    isOffDuty.value = true;
    ncItems.value = [];
    showCustomReasonModal.value = false;
  });

  // Handler for custom reason modal cancel
  const handleCustomReasonModalCancel = $(() => {
    showCustomReasonModal.value = false;
  });

  const getTotalNcHours = $(() => {
    const total: number = Number(ncItems.value
      .reduce((sum, x) => sum + (Number(x.hours) || 0), 0)
      .toFixed(2))
      return total;
  })

  const getTotalNcPay = $(() => {
    const pay = ncItems.value
      .reduce((sum, x) => {
        const rate = x.rate != null && Number.isFinite(x.rate) ? x.rate : -1; // Using -1 for now to show error state
        return sum + (Number(x.hours) || 0) * rate;
      }, 0)
      .toFixed(2);
      return pay;
  })

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
          <h2
            class="text-xl font-bold mb-4"
            style="color: rgb(var(--color-text-primary))"
          >
            Delete Hauls to Mark Off Duty?
          </h2>
          <p class="mb-4" style="color: rgb(var(--color-text-secondary))">
            This workday has <strong>{haulCount}</strong> haul
            {haulCount !== 1 ? 's' : ''} that will be deleted if you mark this
            day as off-duty.
          </p>

          {/* List hauls */}
          <div class="mb-4 max-h-48 overflow-y-auto">
            <ul class="space-y-2">
              {(workday.value.hauls || []).map((haul: any) => (
                <li
                  key={haul.id}
                  class="p-2 rounded"
                  style="background-color: rgb(var(--color-bg-secondary))"
                >
                  <div class="font-medium">{haul.customer}</div>
                  <div
                    class="text-sm"
                    style="color: rgb(var(--color-text-tertiary))"
                  >
                    {haul.loadRefNum
                      ? `Ref: ${haul.loadRefNum}`
                      : 'No ref number'}{' '}
                    • {haul.quantity}t @ ${haul.rate}/t
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div class="flex justify-end gap-3">
            <button class="btn btn-ghost" onClick$={handleDeleteHaulsCancel}>
              Cancel
            </button>
            <button class="btn btn-danger" onClick$={handleDeleteHaulsConfirm}>
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
          <h2
            class="text-xl font-bold mb-4"
            style="color: rgb(var(--color-text-primary))"
          >
            {customReasonType.value === 'Holiday'
              ? 'Which Holiday?'
              : 'Enter Custom Reason'}
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
              placeholder={
                customReasonType.value === 'Holiday'
                  ? 'e.g., Christmas'
                  : 'e.g., Family emergency'
              }
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
    <div class="container mx-auto p-6 max-w-5xl">
      {/* Back Button */}
      <div class="mb-6">
        {returnToParam && (
          <div class="mb-4">
            <a href={backUrl} class="btn btn-ghost btn-sm">
              ← Back to Hauls
            </a>
          </div>
        )}

        <PageTitle text="Edit Workday" />
      </div>

      <div class="card">
        <Form action={updateAction} class="space-y-6">
          <input type="hidden" name="id" value={workday.value.id} />
          <input type="hidden" name="returnTo" value={decodedReturnTo || ''} />

          {/* Hidden JSON field posted with the form */}
          <input
            type="hidden"
            name="ncItemsJson"
            value={JSON.stringify(ncItems.value)}
          />

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div class="space-y-4">
              {/* Date field */}
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

              {/* Driver field */}
              <div>
                <label
                  for="driverId"
                  class="block text-sm font-medium mb-2"
                  style="color: rgb(var(--color-text-secondary))"
                >
                  Driver *
                </label>
                <select id="driverId" name="driverId" required class="w-full">
                  <option value="">Select a driver</option>
                  {drivers.value.map((driver) => (
                    <option
                      key={driver.id}
                      value={driver.id.toString()}
                      selected={driver.id === workday.value.driverId}
                    >
                      {`${driver.firstName} ${driver.lastName}${driver.defaultTruck ? ` - ${driver.defaultTruck}` : ''}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* C&H Hours field */}
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
                  // value={workday.value.chHours.toString()}
                  value={chHoursInput.value}
                  required
                  class="w-full"
                  onBlur$={(_, el) => {
                    if (el.value === '') return;
                    const n = Number(el.value);
                    const snapped = Math.round(n / 0.25) * 0.25;
                    chHoursInput.value = snapped.toFixed(2);
                  }}
                />
              </div>

              {/* Notes */}
              <div class="mt-8">
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
              <div
                class="rounded-lg p-4"
                style="border: 1px solid rgb(var(--color-border)); background-color: rgb(var(--color-bg-secondary))"
              >
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
                      value={
                        offDutyReason.value.startsWith('Holiday')
                          ? 'Holiday'
                          : offDutyReason.value.startsWith('Other')
                            ? 'Other'
                            : offDutyReason.value
                      }
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
                    <input
                      type="hidden"
                      name="offDutyReason"
                      value={offDutyReason.value}
                    />
                    <input
                      type="hidden"
                      name="offDutyReasonHoliday"
                      value={
                        customReasonType.value === 'Holiday'
                          ? customReasonInput.value
                          : ''
                      }
                    />
                    <input
                      type="hidden"
                      name="offDutyReasonOther"
                      value={
                        customReasonType.value === 'Other'
                          ? customReasonInput.value
                          : ''
                      }
                    />
                    {(customReasonType.value === 'Holiday' ||
                      customReasonType.value === 'Other') &&
                      customReasonInput.value && (
                        <div
                          class="mt-2 p-2 rounded text-sm"
                          style="background-color: rgb(var(--color-bg-tertiary)); color: rgb(var(--color-text-secondary))"
                        >
                          {customReasonType.value}: {customReasonInput.value}
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div class="space-y-4">
              {/* Non-Commission Items */}
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label
                    class="block text-sm font-medium"
                    style="color: rgb(var(--color-text-secondary))"
                  >
                    Non-Commission Items
                  </label>
                  <button
                    type="button"
                    class="btn btn-ghost btn-sm"
                    onClick$={addNcItem}
                    disabled={isOffDuty.value}
                    title={
                      isOffDuty.value
                        ? 'Off duty workdays cannot have NC items.'
                        : 'Add NC item'
                    }
                  >
                    + Add
                  </button>
                </div>

                <div
                  class="overflow-x-auto rounded-lg"
                  style="border: 1px solid rgb(var(--color-border))"
                >
                  <table class="w-full text-sm">
                    <thead style="background-color: rgb(var(--color-bg-secondary))">
                      <tr>
                        <th class="text-left p-2">Description</th>
                        <th class="text-left p-2 w-28">Hours</th>
                        <th class="text-left p-2 w-28">Rate</th>
                        <th class="p-2 w-16"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {ncItems.value.length === 0 ? (
                        <tr>
                          <td
                            class="p-3"
                            colSpan={4}
                            style="color: rgb(var(--color-text-tertiary))"
                          >
                            No NC items. Click “Add” to enter truck wash,
                            maintenance, etc.
                          </td>
                        </tr>
                      ) : (
                        ncItems.value.map((item, idx) => (
                          <tr
                            key={idx}
                            class="border-t"
                            style="border-color: rgb(var(--color-border))"
                          >
                            <td class="p-2">
                              <input
                                type="text"
                                class="w-full"
                                value={item.description}
                                disabled={isOffDuty.value}
                                placeholder="e.g. Truck Wash"
                                onInput$={(_, el) =>
                                  updateNcItem(idx, { description: el.value })
                                }
                              />
                            </td>
                            <td class="p-2">
                              <input
                                type="number"
                                class="w-full"
                                min="0"
                                step="0.25"
                                value={String(item.hours)}
                                disabled={isOffDuty.value}
                                onInput$={(_, el) =>
                                  updateNcItem(idx, {
                                    hours: Number(el.value) || 0,
                                  })
                                }
                              />
                            </td>
                            <td class="p-2">
                              <input
                                type="number"
                                class="w-full"
                                min="0"
                                step="0.01"
                                value={
                                  item.rate == null ? '' : item.rate.toFixed(2)
                                }
                                disabled={isOffDuty.value}
                                placeholder="(default)"
                                onBlur$={(_, el) => {
                                  updateNcItem(idx, {
                                    rate:
                                      el.value === ''
                                        ? null
                                        : Number(Number(el.value).toFixed(2)),
                                  });
                                }}
                              />
                            </td>
                            <td class="p-2 text-right">
                              <button
                                type="button"
                                class="btn btn-ghost btn-sm"
                                onClick$={() => removeNcItem(idx)}
                                disabled={isOffDuty.value}
                                title="Remove"
                                tabIndex={-1}
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div
                  class="mt-2 text-sm"
                  style="color: rgb(var(--color-text-tertiary))"
                >
                  Total:{' '}
                  {getTotalNcHours()}
                  {' hours ($'}
                  {getTotalNcPay()}
                  {')'}
                </div>
              </div>
            </div>
          </div>

          {updateAction.value?.error && (
            <div
              class="p-3 rounded-lg"
              style="background-color: rgb(var(--color-danger) / 0.1); color: rgb(var(--color-danger))"
            >
              {updateAction.value.error}
            </div>
          )}

          {/* Form Buttons */}
          <div class="flex justify-end gap-3">
            <Link href={backUrl} class="btn btn-ghost">
              Cancel
            </Link>
            <button type="submit" class="btn btn-primary">
              Update Workday
            </button>
          </div>
        </Form>

        {updateAction.value?.success && (
          <div
            class="mt-4 p-3 rounded-lg"
            style="background-color: rgb(var(--color-success) / 0.1); color: rgb(var(--color-success))"
          >
            Workday updated successfully! Redirecting...
          </div>
        )}
      </div>
    </div>
  );
});
