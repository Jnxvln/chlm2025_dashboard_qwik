import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, Form, z, zod$, useNavigate, type DocumentHead } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { normalizeFormData } from '~/lib/text-utils';
import PageTitle from '~/components/PageTitle';
import BackButton from '~/components/BackButton';
import { StatusMessage } from '~/components/notifications/StatusMessage';

export const useStoreNoticeLoader = routeLoader$(async ({ params, redirect }) => {
  const id = Number(params.id);

  if (isNaN(id)) {
    throw redirect(302, '/notices/store');
  }

  const storeNotice = await db.storeNotice.findUnique({
    where: { id },
  });

  if (!storeNotice) {
    throw redirect(302, '/notices/store');
  }

  return storeNotice;
});

export const useUpdateStoreNoticeAction = routeAction$(
  async (values, { params, fail }) => {
    const id = Number(params.id);

    if (isNaN(id)) {
      return fail(400, { error: 'Invalid store notice ID' });
    }

    try {
      // Normalize capitalization before saving (content, title preserved, type is enum, checkboxes are boolean)
      const normalized = normalizeFormData(values, {
        skipFields: ['content', 'title', 'type', 'showCreatedAt', 'isActive'],
      });

      // Combine date and time into a single DateTime for displayUntil
      const displayUntilDateTime = new Date(`${normalized.displayUntilDate}T${normalized.displayUntilTime}`);

      // Parse boolean values (use raw values, not normalized)
      const showCreatedAt = values.showCreatedAt === 'on' || values.showCreatedAt === 'true' || values.showCreatedAt === true;
      const isActive = values.isActive === 'on' || values.isActive === 'true' || values.isActive === true;

      // Update the store notice
      await db.storeNotice.update({
        where: { id },
        data: {
          title: normalized.title,
          content: normalized.content,
          type: normalized.type as any,
          displayUntil: displayUntilDateTime,
          showCreatedAt,
          isActive,
        },
      });

      return { success: true, storeNoticeId: id };
    } catch (error) {
      console.error('Failed to update store notice:', error);
      return fail(500, { error: 'Failed to update store notice. Please try again.' });
    }
  },
  zod$({
    title: z.string().min(1, 'Title is required'),
    content: z.string().min(1, 'Content is required'),
    displayUntilDate: z.string().min(1, 'Display until date is required'),
    displayUntilTime: z.string().min(1, 'Display until time is required'),
    type: z.enum(['info', 'warning', 'danger', 'success']),
    showCreatedAt: z.union([z.string(), z.boolean()]).optional(),
    isActive: z.union([z.string(), z.boolean()]).optional(),
  }),
);

export default component$(() => {
  const storeNotice = useStoreNoticeLoader();
  const updateStoreNoticeAction = useUpdateStoreNoticeAction();
  const navigate = useNavigate();
  const success = useSignal(false);

  // Format date and time for input[type="date"] and input[type="time"]
  const displayUntilDateTime = new Date(storeNotice.value.displayUntil);
  const displayUntilDate = displayUntilDateTime.toISOString().split('T')[0];
  const displayUntilTime = displayUntilDateTime.toTimeString().slice(0, 5); // HH:MM format

  // Track action result and navigate on success
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => updateStoreNoticeAction.value);

    if (updateStoreNoticeAction.value?.success) {
      success.value = true;
      setTimeout(() => {
        navigate('/notices/store');
      }, 1500);
    }
  });

  return (
    <div class="container mx-auto p-6">
      <div class="mb-6">
        <BackButton />
        <PageTitle text="Edit Store Notice" />
        <p class="text-sm mt-2" style="color: rgb(var(--color-text-secondary))">
          Update store notice details. Changes will be reflected on the public website.
        </p>
      </div>

      <div class="card max-w-4xl">
        <div class="card-header">
          <h2 class="text-lg font-semibold" style="color: rgb(var(--color-text-primary))">
            Store Notice Details
          </h2>
        </div>

        <Form action={updateStoreNoticeAction} class="space-y-6">
          {/* Title */}
          <div>
            <label
              for="title"
              class="block text-sm font-medium mb-2"
              style="color: rgb(var(--color-text-primary))"
            >
              Title *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              class="w-full"
              placeholder="Enter notice title..."
              value={storeNotice.value.title}
              required
              style="background-color: rgb(var(--color-bg-primary)); border: 1px solid rgb(var(--color-border)); color: rgb(var(--color-text-primary))"
            />
          </div>

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
              value={storeNotice.value.content}
              required
              style="background-color: rgb(var(--color-bg-primary)); border: 1px solid rgb(var(--color-border)); color: rgb(var(--color-text-primary))"
            ></textarea>
            <p class="text-xs mt-1" style="color: rgb(var(--color-text-secondary))">
              Line breaks will be preserved when displayed.
            </p>
          </div>

          {/* Display Until and Type */}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                for="displayUntilDate"
                class="block text-sm font-medium mb-2"
                style="color: rgb(var(--color-text-primary))"
              >
                Display Until Date & Time *
              </label>
              <div class="grid grid-cols-2 gap-2">
                <input
                  id="displayUntilDate"
                  name="displayUntilDate"
                  type="date"
                  class="w-full"
                  value={displayUntilDate}
                  required
                  style="background-color: rgb(var(--color-bg-primary)); border: 1px solid rgb(var(--color-border)); color: rgb(var(--color-text-primary))"
                />
                <input
                  id="displayUntilTime"
                  name="displayUntilTime"
                  type="time"
                  class="w-full"
                  value={displayUntilTime}
                  required
                  style="background-color: rgb(var(--color-bg-primary)); border: 1px solid rgb(var(--color-border)); color: rgb(var(--color-text-primary))"
                />
              </div>
              <p class="text-xs mt-1" style="color: rgb(var(--color-text-secondary))">
                Notice will be hidden after this date/time
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
                value={storeNotice.value.type}
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

          {/* Options */}
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <input
                id="showCreatedAt"
                name="showCreatedAt"
                type="checkbox"
                class="w-4 h-4"
                checked={storeNotice.value.showCreatedAt ? true : undefined}
              />
              <label
                for="showCreatedAt"
                class="text-sm font-medium cursor-pointer"
                style="color: rgb(var(--color-text-primary))"
              >
                Show created date on public website
              </label>
            </div>

            <div class="flex items-center gap-3">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                class="w-4 h-4"
                checked={storeNotice.value.isActive ? true : undefined}
              />
              <label
                for="isActive"
                class="text-sm font-medium cursor-pointer"
                style="color: rgb(var(--color-text-primary))"
              >
                Active (visible on public website)
              </label>
            </div>
          </div>

          {/* Error/Success Messages */}
          {updateStoreNoticeAction.value?.error && (
            <StatusMessage
              type="error"
              title="Update Failed"
              message={updateStoreNoticeAction.value.error}
            />
          )}

          {success.value && (
            <StatusMessage
              type="success"
              title="Store Notice Updated!"
              message="Redirecting to store notices..."
            />
          )}

          {/* Action Buttons */}
          <div class="flex justify-end gap-3 pt-4" style="border-top: 1px solid rgb(var(--color-border))">
            <a href="/notices/store" class="btn btn-ghost">
              Cancel
            </a>
            <button
              type="submit"
              class="btn btn-primary"
              disabled={updateStoreNoticeAction.isRunning || success.value}
            >
              {updateStoreNoticeAction.isRunning ? 'Updating...' : 'Update Store Notice'}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'Edit Store Notice - CHLM Dashboard',
  meta: [
    {
      name: 'description',
      content: 'Edit a store notice for the public website',
    },
  ],
};
