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

// Tailwind color options for theme selector
const TAILWIND_COLORS = [
  'default', 'slate', 'gray', 'zinc', 'neutral', 'stone',
  'red', 'orange', 'amber', 'yellow', 'lime', 'green',
  'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo',
  'violet', 'purple', 'fuchsia', 'pink', 'rose'
];

export const useSettings = routeLoader$(async () => {
  // Get the first (and only) settings record, or create it if it doesn't exist
  let settings = await db.settings.findFirst();

  if (!settings) {
    settings = await db.settings.create({
      data: {}, // Uses all defaults from schema
    });
  }

  // Convert Decimal types to numbers for serialization (with 2 decimal places)
  const result = {
    ...settings,
    driverDefaultNCPayRate: Number(settings.driverDefaultNCPayRate).toFixed(2),
    driverDefaultHolidayPayRate: Number(settings.driverDefaultHolidayPayRate).toFixed(2),
  };

  console.log('📊 SETTINGS LOADER - Returning settings:', JSON.stringify(result, null, 2));

  return result;
});

export const useUpdateSettings = routeAction$(
  async (data) => {
    try {
      console.log('📝 SETTINGS UPDATE - Received data:', JSON.stringify(data, null, 2));

      // Find the first settings record
      const existingSettings = await db.settings.findFirst();

      if (!existingSettings) {
        throw new Error('Settings record not found');
      }

      // Update the settings
      const updated = await db.settings.update({
        where: { id: existingSettings.id },
        data: {
          storeOpen: data.storeOpen === 'true',
          storeClosureType: data.storeClosureType,
          storeCustomClosureMessage: data.storeCustomClosureMessage || null,
          storeDefaultClosureReason: data.storeDefaultClosureReason,
          storeDefaultClosureReasonWeather: data.storeDefaultClosureReasonWeather,
          storeDefaultClosureReasonHoliday: data.storeDefaultClosureReasonHoliday,
          storeDisplayInventoryStatus: data.storeDisplayInventoryStatus === 'true',
          operatingHoursMonFriStart: data.operatingHoursMonFriStart,
          operatingHoursMonFriEnd: data.operatingHoursMonFriEnd,
          operatingHoursSatStart: data.operatingHoursSatStart,
          operatingHoursSatEnd: data.operatingHoursSatEnd,
          operatingHoursSunStart: data.operatingHoursSunStart,
          operatingHoursSunEnd: data.operatingHoursSunEnd,
          driverDefaultNCPayRate: Number(data.driverDefaultNCPayRate).toFixed(2),
          driverDefaultHolidayPayRate: Number(data.driverDefaultHolidayPayRate).toFixed(2),
          userPrefersCaps: data.userPrefersCaps === 'true',
          userDefaultColorTheme: data.userDefaultColorTheme,
        },
      });

      console.log('✅ SETTINGS UPDATE - Successfully saved:', JSON.stringify(updated, null, 2));

      // Return the updated settings so we can sync the UI (with 2 decimal places)
      return {
        success: true,
        settings: {
          ...updated,
          driverDefaultNCPayRate: Number(updated.driverDefaultNCPayRate).toFixed(2),
          driverDefaultHolidayPayRate: Number(updated.driverDefaultHolidayPayRate).toFixed(2),
        }
      };
    } catch (err) {
      console.error('❌ SETTINGS UPDATE - Failed:', err);
      return { success: false, error: 'Failed to update settings' };
    }
  },
  zod$(
    z.object({
      storeOpen: z.string(),
      storeClosureType: z.string(),
      storeCustomClosureMessage: z.string().optional(),
      storeDefaultClosureReason: z.string(),
      storeDefaultClosureReasonWeather: z.string(),
      storeDefaultClosureReasonHoliday: z.string(),
      storeDisplayInventoryStatus: z.string(),
      operatingHoursMonFriStart: z.string(),
      operatingHoursMonFriEnd: z.string(),
      operatingHoursSatStart: z.string(),
      operatingHoursSatEnd: z.string(),
      operatingHoursSunStart: z.string(),
      operatingHoursSunEnd: z.string(),
      driverDefaultNCPayRate: z.coerce.number(),
      driverDefaultHolidayPayRate: z.coerce.number(),
      userPrefersCaps: z.string(),
      userDefaultColorTheme: z.string(),
    }),
  ),
);

export default component$(() => {
  const settings = useSettings();
  const updateSettings = useUpdateSettings();
  const success = useSignal(false);

  // Operating hours "closed" state signals (initialized in useVisibleTask)
  const monFriClosed = useSignal(false);
  const satClosed = useSignal(false);
  const sunClosed = useSignal(false);

  // Store closure state (initialized in useVisibleTask)
  const storeOpen = useSignal('true');
  const closureType = useSignal('default');

  // Dropdown state signals (initialized in useVisibleTask)
  const storeDisplayInventory = useSignal('true');
  const userPrefersCaps = useSignal('false');
  const userColorTheme = useSignal('default');

  // Text input signals (initialized in useVisibleTask)
  const storeDefaultClosureReason = useSignal('');
  const storeDefaultClosureReasonWeather = useSignal('');
  const storeDefaultClosureReasonHoliday = useSignal('');
  const storeCustomClosureMessage = useSignal('');
  const operatingHoursMonFriStart = useSignal('08:00');
  const operatingHoursMonFriEnd = useSignal('17:00');
  const operatingHoursSatStart = useSignal('08:00');
  const operatingHoursSatEnd = useSignal('12:00');
  const operatingHoursSunStart = useSignal('CLOSED');
  const operatingHoursSunEnd = useSignal('CLOSED');
  const driverDefaultNCPayRate = useSignal('0.00');
  const driverDefaultHolidayPayRate = useSignal('0.00');

  // Sync all signals with loaded settings ONCE on client-side mount
  useVisibleTask$(() => {
    console.log('🎨 CLIENT - Syncing signals with loaded settings:', {
      storeOpen: settings.value.storeOpen,
      storeClosureType: settings.value.storeClosureType,
      storeDisplayInventoryStatus: settings.value.storeDisplayInventoryStatus,
      userPrefersCaps: settings.value.userPrefersCaps,
      userDefaultColorTheme: settings.value.userDefaultColorTheme,
    });

    // Sync all signals with loaded settings on mount
    // This runs once when component mounts (including after navigation/refresh)
    storeOpen.value = settings.value.storeOpen ? 'true' : 'false';
    closureType.value = settings.value.storeClosureType || 'default';
    storeDisplayInventory.value = settings.value.storeDisplayInventoryStatus ? 'true' : 'false';
    userPrefersCaps.value = settings.value.userPrefersCaps ? 'true' : 'false';
    userColorTheme.value = settings.value.userDefaultColorTheme;

    storeDefaultClosureReason.value = settings.value.storeDefaultClosureReason;
    storeDefaultClosureReasonWeather.value = settings.value.storeDefaultClosureReasonWeather;
    storeDefaultClosureReasonHoliday.value = settings.value.storeDefaultClosureReasonHoliday;
    storeCustomClosureMessage.value = settings.value.storeCustomClosureMessage || '';

    monFriClosed.value = settings.value.operatingHoursMonFriStart === 'CLOSED';
    satClosed.value = settings.value.operatingHoursSatStart === 'CLOSED';
    sunClosed.value = settings.value.operatingHoursSunStart === 'CLOSED';
    operatingHoursMonFriStart.value = settings.value.operatingHoursMonFriStart;
    operatingHoursMonFriEnd.value = settings.value.operatingHoursMonFriEnd;
    operatingHoursSatStart.value = settings.value.operatingHoursSatStart;
    operatingHoursSatEnd.value = settings.value.operatingHoursSatEnd;
    operatingHoursSunStart.value = settings.value.operatingHoursSunStart;
    operatingHoursSunEnd.value = settings.value.operatingHoursSunEnd;

    driverDefaultNCPayRate.value = String(settings.value.driverDefaultNCPayRate);
    driverDefaultHolidayPayRate.value = String(settings.value.driverDefaultHolidayPayRate);
  });

  useVisibleTask$(({ track }) => {
    const result = track(() => updateSettings.value);
    if (result?.success && result?.settings) {
      console.log('✅ CLIENT - Update successful, syncing signals with:', result.settings);
      success.value = true;

      // Update all signals with the fresh data from the server
      storeOpen.value = result.settings.storeOpen ? 'true' : 'false';
      closureType.value = result.settings.storeClosureType || 'default';
      storeDisplayInventory.value = result.settings.storeDisplayInventoryStatus ? 'true' : 'false';
      userPrefersCaps.value = result.settings.userPrefersCaps ? 'true' : 'false';
      userColorTheme.value = result.settings.userDefaultColorTheme;

      storeDefaultClosureReason.value = result.settings.storeDefaultClosureReason;
      storeDefaultClosureReasonWeather.value = result.settings.storeDefaultClosureReasonWeather;
      storeDefaultClosureReasonHoliday.value = result.settings.storeDefaultClosureReasonHoliday;
      storeCustomClosureMessage.value = result.settings.storeCustomClosureMessage || '';

      monFriClosed.value = result.settings.operatingHoursMonFriStart === 'CLOSED';
      satClosed.value = result.settings.operatingHoursSatStart === 'CLOSED';
      sunClosed.value = result.settings.operatingHoursSunStart === 'CLOSED';
      operatingHoursMonFriStart.value = result.settings.operatingHoursMonFriStart;
      operatingHoursMonFriEnd.value = result.settings.operatingHoursMonFriEnd;
      operatingHoursSatStart.value = result.settings.operatingHoursSatStart;
      operatingHoursSatEnd.value = result.settings.operatingHoursSatEnd;
      operatingHoursSunStart.value = result.settings.operatingHoursSunStart;
      operatingHoursSunEnd.value = result.settings.operatingHoursSunEnd;

      driverDefaultNCPayRate.value = String(result.settings.driverDefaultNCPayRate);
      driverDefaultHolidayPayRate.value = String(result.settings.driverDefaultHolidayPayRate);

      // Hide success message after 3 seconds
      setTimeout(() => {
        success.value = false;
      }, 3000);
    }
  });

  return (
    <section class="container mx-auto p-6">
      <PageTitle text="Settings" />

      <div class="card mt-6 max-w-4xl">
        <Form action={updateSettings} class="space-y-8">

          {/* STORE SETTINGS */}
          <div>
            <h2 class="text-xl font-semibold mb-4" style="color: rgb(var(--color-text-primary))">
              Store Settings
            </h2>
            <div class="space-y-4">

              <div>
                <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">
                  Store Status
                </label>
                <select
                  name="storeOpen"
                  class="w-full font-semibold"
                  style={{
                    backgroundColor: storeOpen.value === 'false' ? 'rgb(var(--color-danger) / 0.1)' : 'rgb(var(--color-success) / 0.1)',
                    color: storeOpen.value === 'false' ? 'rgb(var(--color-danger))' : 'rgb(var(--color-success))',
                    borderColor: storeOpen.value === 'false' ? 'rgb(var(--color-danger))' : 'rgb(var(--color-success))',
                    borderWidth: '2px'
                  }}
                  value={storeOpen.value}
                  onChange$={(_, el) => {
                    storeOpen.value = el.value;
                  }}
                >
                  <option value="true">Open</option>
                  <option value="false">Closed</option>
                </select>
              </div>

              {/* Show closure options when store is closed */}
              {storeOpen.value === 'false' && (
                <>
                  <div>
                    <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">
                      Closure Message Type
                    </label>
                    <select
                      name="storeClosureType"
                      class="w-full"
                      value={closureType.value}
                      onChange$={(e) => {
                        closureType.value = (e.target as HTMLSelectElement).value;
                      }}
                    >
                      <option value="default">Default Closure Message</option>
                      <option value="weather">Weather Closure</option>
                      <option value="holiday">Holiday Closure</option>
                      <option value="custom">Custom Message</option>
                    </select>
                  </div>

                  {/* Preview message */}
                  <div class="p-4 rounded-lg mt-2 mb-4" style="background-color: rgb(var(--color-info) / 0.1); color: rgb(var(--color-text-secondary))">
                    <div class="text-xs font-semibold mb-2">Preview:</div>
                    <div class="text-sm">
                      {closureType.value === 'default' && settings.value.storeDefaultClosureReason}
                      {closureType.value === 'weather' && settings.value.storeDefaultClosureReasonWeather}
                      {closureType.value === 'holiday' && settings.value.storeDefaultClosureReasonHoliday}
                      {closureType.value === 'custom' && 'Enter custom message below'}
                    </div>
                  </div>

                  {/* Custom message input */}
                  {closureType.value === 'custom' && (
                    <div>
                      <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">
                        Custom Closure Message
                      </label>
                      <input
                        name="storeCustomClosureMessage"
                        type="text"
                        value={storeCustomClosureMessage.value}
                        onInput$={(_, el) => {
                          storeCustomClosureMessage.value = el.value;
                        }}
                        placeholder="Enter custom closure message..."
                        class="w-full"
                      />
                    </div>
                  )}

                  {/* Hidden field for non-custom types */}
                  {closureType.value !== 'custom' && (
                    <input name="storeCustomClosureMessage" type="hidden" value="" />
                  )}
                </>
              )}

              {/* Hidden fields when store is open - clear custom message */}
              {storeOpen.value === 'true' && (
                <>
                  <input name="storeClosureType" type="hidden" value="default" />
                  <input name="storeCustomClosureMessage" type="hidden" value="" />
                </>
              )}

              <div>
                <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">
                  Default Closure Message
                </label>
                <input
                  name="storeDefaultClosureReason"
                  type="text"
                  value={storeDefaultClosureReason.value}
                  onInput$={(_, el) => {
                    storeDefaultClosureReason.value = el.value;
                  }}
                  class="w-full"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">
                  Weather Closure Message
                </label>
                <input
                  name="storeDefaultClosureReasonWeather"
                  type="text"
                  value={storeDefaultClosureReasonWeather.value}
                  onInput$={(_, el) => {
                    storeDefaultClosureReasonWeather.value = el.value;
                  }}
                  class="w-full"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">
                  Holiday Closure Message
                </label>
                <input
                  name="storeDefaultClosureReasonHoliday"
                  type="text"
                  value={storeDefaultClosureReasonHoliday.value}
                  onInput$={(_, el) => {
                    storeDefaultClosureReasonHoliday.value = el.value;
                  }}
                  class="w-full"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">
                  Display Inventory Status
                </label>
                <select
                  name="storeDisplayInventoryStatus"
                  class="w-full"
                  value={storeDisplayInventory.value}
                  onChange$={(_, el) => {
                    storeDisplayInventory.value = el.value;
                  }}
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
          </div>

          {/* OPERATING HOURS */}
          <div>
            <h2 class="text-xl font-semibold mb-4" style="color: rgb(var(--color-text-primary))">
              Operating Hours
            </h2>
            <div class="space-y-6">

              {/* Monday - Friday */}
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="monFriClosed"
                    checked={monFriClosed.value}
                    onChange$={(e) => {
                      monFriClosed.value = (e.target as HTMLInputElement).checked;
                    }}
                    style="accent-color: rgb(var(--color-primary))"
                  />
                  <label for="monFriClosed" class="text-sm font-medium" style="color: rgb(var(--color-text-secondary))">
                    Monday - Friday (Closed)
                  </label>
                </div>

                {!monFriClosed.value && (
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">
                        Start Time
                      </label>
                      <input
                        name="operatingHoursMonFriStart"
                        type="time"
                        value={operatingHoursMonFriStart.value === 'CLOSED' ? '08:00' : operatingHoursMonFriStart.value}
                        onInput$={(_, el) => {
                          operatingHoursMonFriStart.value = el.value;
                        }}
                        class="w-full"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">
                        End Time
                      </label>
                      <input
                        name="operatingHoursMonFriEnd"
                        type="time"
                        value={operatingHoursMonFriEnd.value === 'CLOSED' ? '17:00' : operatingHoursMonFriEnd.value}
                        onInput$={(_, el) => {
                          operatingHoursMonFriEnd.value = el.value;
                        }}
                        class="w-full"
                      />
                    </div>
                  </div>
                )}

                {monFriClosed.value && (
                  <>
                    <input name="operatingHoursMonFriStart" type="hidden" value="CLOSED" />
                    <input name="operatingHoursMonFriEnd" type="hidden" value="CLOSED" />
                  </>
                )}
              </div>

              {/* Saturday */}
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="satClosed"
                    checked={satClosed.value}
                    onChange$={(e) => {
                      satClosed.value = (e.target as HTMLInputElement).checked;
                    }}
                    style="accent-color: rgb(var(--color-primary))"
                  />
                  <label for="satClosed" class="text-sm font-medium" style="color: rgb(var(--color-text-secondary))">
                    Saturday (Closed)
                  </label>
                </div>

                {!satClosed.value && (
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">
                        Start Time
                      </label>
                      <input
                        name="operatingHoursSatStart"
                        type="time"
                        value={operatingHoursSatStart.value === 'CLOSED' ? '08:00' : operatingHoursSatStart.value}
                        onInput$={(_, el) => {
                          operatingHoursSatStart.value = el.value;
                        }}
                        class="w-full"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">
                        End Time
                      </label>
                      <input
                        name="operatingHoursSatEnd"
                        type="time"
                        value={operatingHoursSatEnd.value === 'CLOSED' ? '12:00' : operatingHoursSatEnd.value}
                        onInput$={(_, el) => {
                          operatingHoursSatEnd.value = el.value;
                        }}
                        class="w-full"
                      />
                    </div>
                  </div>
                )}

                {satClosed.value && (
                  <>
                    <input name="operatingHoursSatStart" type="hidden" value="CLOSED" />
                    <input name="operatingHoursSatEnd" type="hidden" value="CLOSED" />
                  </>
                )}
              </div>

              {/* Sunday */}
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="sunClosed"
                    checked={sunClosed.value}
                    onChange$={(e) => {
                      sunClosed.value = (e.target as HTMLInputElement).checked;
                    }}
                    style="accent-color: rgb(var(--color-primary))"
                  />
                  <label for="sunClosed" class="text-sm font-medium" style="color: rgb(var(--color-text-secondary))">
                    Sunday (Closed)
                  </label>
                </div>

                {!sunClosed.value && (
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">
                        Start Time
                      </label>
                      <input
                        name="operatingHoursSunStart"
                        type="time"
                        value={operatingHoursSunStart.value === 'CLOSED' ? '08:00' : operatingHoursSunStart.value}
                        onInput$={(_, el) => {
                          operatingHoursSunStart.value = el.value;
                        }}
                        class="w-full"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">
                        End Time
                      </label>
                      <input
                        name="operatingHoursSunEnd"
                        type="time"
                        value={operatingHoursSunEnd.value === 'CLOSED' ? '17:00' : operatingHoursSunEnd.value}
                        onInput$={(_, el) => {
                          operatingHoursSunEnd.value = el.value;
                        }}
                        class="w-full"
                      />
                    </div>
                  </div>
                )}

                {sunClosed.value && (
                  <>
                    <input name="operatingHoursSunStart" type="hidden" value="CLOSED" />
                    <input name="operatingHoursSunEnd" type="hidden" value="CLOSED" />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* DRIVER SETTINGS */}
          <div>
            <h2 class="text-xl font-semibold mb-4" style="color: rgb(var(--color-text-primary))">
              Driver Settings
            </h2>
            <div class="space-y-4">

              <div>
                <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">
                  Default Non-Commission Pay Rate
                </label>
                <input
                  name="driverDefaultNCPayRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={driverDefaultNCPayRate.value}
                  onInput$={(_, el) => {
                    driverDefaultNCPayRate.value = el.value;
                  }}
                  onBlur$={(_, el) => {
                    const num = parseFloat(el.value) || 0;
                    driverDefaultNCPayRate.value = num.toFixed(2);
                  }}
                  class="w-full"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">
                  Default Holiday Pay Rate
                </label>
                <input
                  name="driverDefaultHolidayPayRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={driverDefaultHolidayPayRate.value}
                  onInput$={(_, el) => {
                    driverDefaultHolidayPayRate.value = el.value;
                  }}
                  onBlur$={(_, el) => {
                    const num = parseFloat(el.value) || 0;
                    driverDefaultHolidayPayRate.value = num.toFixed(2);
                  }}
                  class="w-full"
                />
              </div>
            </div>
          </div>

          {/* USER PREFERENCES */}
          <div>
            <h2 class="text-xl font-semibold mb-4" style="color: rgb(var(--color-text-primary))">
              User Preferences
            </h2>
            <div class="space-y-4">

              <div>
                <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">
                  Prefer All-Caps Text
                </label>
                <select
                  name="userPrefersCaps"
                  class="w-full"
                  value={userPrefersCaps.value}
                  onChange$={(_, el) => {
                    userPrefersCaps.value = el.value;
                  }}
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium mb-2" style="color: rgb(var(--color-text-secondary))">
                  Default Color Theme
                </label>
                <select
                  name="userDefaultColorTheme"
                  class="w-full"
                  value={userColorTheme.value}
                  onChange$={(_, el) => {
                    userColorTheme.value = el.value;
                  }}
                >
                  {TAILWIND_COLORS.map((color) => (
                    <option key={color} value={color}>
                      {color.charAt(0).toUpperCase() + color.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Error/Success Messages */}
          {updateSettings.value?.error && (
            <div class="p-3 rounded-lg" style="background-color: rgb(var(--color-danger) / 0.1); color: rgb(var(--color-danger))">
              {updateSettings.value.error}
            </div>
          )}
          {success.value && (
            <div class="p-3 rounded-lg" style="background-color: rgb(var(--color-success) / 0.1); color: rgb(var(--color-success))">
              Settings updated successfully!
            </div>
          )}

          {/* Submit Button */}
          <div class="flex justify-end">
            <button
              type="submit"
              class="btn btn-primary"
              disabled={updateSettings.isRunning || success.value}
            >
              {updateSettings.isRunning ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </Form>
      </div>
    </section>
  );
});
