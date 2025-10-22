import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { routeAction$, Form, z, zod$, useNavigate, type DocumentHead } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { normalizeFormData } from '~/lib/text-utils';
import PageTitle from '~/components/PageTitle';
import BackButton from '~/components/BackButton';
import { StatusMessage } from '~/components/notifications/StatusMessage';
import { URLInputList } from '~/components/notices/URLInputList';

export const useCreateNoticeAction = routeAction$(
  async (values, { fail }) => {
    try {
      // Normalize capitalization before saving (content is preserved like notes, type is enum, url fields preserved)
      const normalized = normalizeFormData(values, {
        skipFields: ['content', 'type', 'urlDisplayText', 'urlAddress', 'urlIsExternal'],
      });

      // Parse URL data from form arrays
      const urlDisplayTexts = normalized.urlDisplayText || [];
      const urlAddresses = normalized.urlAddress || [];
      const urlIsExternals = normalized.urlIsExternal || [];

      // Convert to arrays if single values
      const displayTexts = Array.isArray(urlDisplayTexts) ? urlDisplayTexts : urlDisplayTexts ? [urlDisplayTexts] : [];
      const addresses = Array.isArray(urlAddresses) ? urlAddresses : urlAddresses ? [urlAddresses] : [];
      const externals = Array.isArray(urlIsExternals) ? urlIsExternals : urlIsExternals ? [urlIsExternals] : [];

      // Build URLs array
      const urls = [];
      for (let i = 0; i < addresses.length; i++) {
        if (addresses[i] && addresses[i].trim() && displayTexts[i] && displayTexts[i].trim()) {
          urls.push({
            displayText: displayTexts[i].trim(),
            url: addresses[i].trim(),
            isExternal: externals[i] === 'on' || externals[i] === 'true' || externals[i] === true,
          });
        }
      }

      // Combine date and time into a single DateTime
      const displayDateTime = new Date(`${normalized.displayDate}T${normalized.displayTime}`);

      // Create the notice with associated URLs
      const notice = await db.notice.create({
        data: {
          content: normalized.content,
          displayDate: displayDateTime,
          type: normalized.type as any,
          urls: urls.length > 0 ? {
            create: urls,
          } : undefined,
        },
      });

      return { success: true, noticeId: notice.id };
    } catch (error) {
      console.error('Failed to create notice:', error);
      return fail(500, { error: 'Failed to create notice. Please try again.' });
    }
  },
  zod$({
    content: z.string().min(1, 'Content is required'),
    displayDate: z.string().min(1, 'Display date is required'),
    displayTime: z.string().min(1, 'Display time is required'),
    type: z.enum(['info', 'warning', 'danger', 'success']),
    urlDisplayText: z.union([z.string(), z.array(z.string())]).optional(),
    urlAddress: z.union([z.string(), z.array(z.string())]).optional(),
    urlIsExternal: z.union([z.string(), z.array(z.string()), z.boolean(), z.array(z.boolean())]).optional(),
  }),
);

export default component$(() => {
  const createNoticeAction = useCreateNoticeAction();
  const navigate = useNavigate();
  const success = useSignal(false);

  // Get today's date in YYYY-MM-DD format for default value
  const today = new Date().toISOString().split('T')[0];

  // Track action result and navigate on success
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => createNoticeAction.value);

    if (createNoticeAction.value?.success) {
      success.value = true;
      setTimeout(() => {
        navigate('/notices');
      }, 1500);
    }
  });

  return (
    <div class="container mx-auto p-6">
      <div class="mb-6">
        <BackButton />
        <PageTitle text="Create New Notice" />
        <p class="text-sm mt-2" style="color: rgb(var(--color-text-secondary))">
          Create a new notice to display on the dashboard. Set the display date to control when it appears.
        </p>
      </div>

      <div class="card max-w-4xl">
        <div class="card-header">
          <h2 class="text-lg font-semibold" style="color: rgb(var(--color-text-primary))">
            Notice Details
          </h2>
        </div>

        <Form action={createNoticeAction} class="space-y-6">
          {/* Content */}
          <div>
            <label
              for="content"
              class="block text-sm font-medium mb-2"
              style="color: rgb(var(--color-text-primary))"
            >
              Content *
            </label>
            <textarea
              id="content"
              name="content"
              rows={4}
              class="w-full"
              placeholder="Enter the notice content... (line breaks are supported)"
              required
              style="background-color: rgb(var(--color-bg-primary)); border: 1px solid rgb(var(--color-border)); color: rgb(var(--color-text-primary))"
            ></textarea>
            <p class="text-xs mt-1" style="color: rgb(var(--color-text-secondary))">
              Line breaks will be preserved when displayed.
            </p>
          </div>

          {/* Display Date and Type */}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                for="displayDate"
                class="block text-sm font-medium mb-2"
                style="color: rgb(var(--color-text-primary))"
              >
                Display Date & Time *
              </label>
              <div class="grid grid-cols-2 gap-2">
                <input
                  id="displayDate"
                  name="displayDate"
                  type="date"
                  class="w-full"
                  value={today}
                  required
                  style="background-color: rgb(var(--color-bg-primary)); border: 1px solid rgb(var(--color-border)); color: rgb(var(--color-text-primary))"
                />
                <input
                  id="displayTime"
                  name="displayTime"
                  type="time"
                  class="w-full"
                  value="08:00"
                  required
                  style="background-color: rgb(var(--color-bg-primary)); border: 1px solid rgb(var(--color-border)); color: rgb(var(--color-text-primary))"
                />
              </div>
              <p class="text-xs mt-1" style="color: rgb(var(--color-text-secondary))">
                Notice will appear on or after this date/time
              </p>
            </div>

            <div>
              <label
                for="type"
                class="block text-sm font-medium mb-2"
                style="color: rgb(var(--color-text-primary))"
              >
                Notice Type *
              </label>
              <select
                id="type"
                name="type"
                class="w-full"
                required
                style="background-color: rgb(var(--color-bg-primary)); border: 1px solid rgb(var(--color-border)); color: rgb(var(--color-text-primary))"
              >
                <option value="info">Info (Gray/Slate)</option>
                <option value="warning">Warning (Yellow)</option>
                <option value="danger">Danger (Red)</option>
                <option value="success">Success (Green)</option>
              </select>
            </div>
          </div>

          {/* URL Input List */}
          <div>
            <URLInputList />
          </div>

          {/* Error/Success Messages */}
          {createNoticeAction.value?.error && (
            <StatusMessage
              type="error"
              title="Creation Failed"
              message={createNoticeAction.value.error}
            />
          )}

          {success.value && (
            <StatusMessage
              type="success"
              title="Notice Created!"
              message="Redirecting to notice board..."
            />
          )}

          {/* Action Buttons */}
          <div class="flex justify-end gap-3 pt-4" style="border-top: 1px solid rgb(var(--color-border))">
            <a href="/notices" class="btn btn-ghost">
              Cancel
            </a>
            <button
              type="submit"
              class="btn btn-primary"
              disabled={createNoticeAction.isRunning || success.value}
            >
              {createNoticeAction.isRunning ? 'Creating...' : 'Create Notice'}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Create Notice - CHLM Dashboard',
  meta: [
    {
      name: 'description',
      content: 'Create a new notice for the CHLM dashboard',
    },
  ],
};
