import {
  component$,
  useVisibleTask$,
} from '@builder.io/qwik';
import {
  routeAction$,
  routeLoader$,
  z,
  zod$,
  Form,
  useNavigate,
  useLocation,
} from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import PageSubtitle from '~/components/PageSubtitle';
import BackButton from '~/components/BackButton';
import { normalizeFormData } from '~/lib/text-utils';

export const useEditContactLoader = routeLoader$(async (event) => {
  const id = parseInt(event.params.id);

  const contact = await db.contact.findUnique({
    where: { id },
  });

  if (!contact) {
    throw event.error(404, 'Contact not found');
  }

  return contact;
});

export const useUpdateContact = routeAction$(
  async (values, event) => {
    const id = parseInt(event.params.id);

    // Normalize capitalization before saving to database
    const normalized = normalizeFormData(values);

    await db.contact.update({
      where: { id },
      data: {
        firstName: normalized.firstName,
        lastName: normalized.lastName,
        companyName: normalized.companyName || null,
        phone1: normalized.phone1,
        phone2: normalized.phone2 || null,
        email1: normalized.email1 || null,
        email2: normalized.email2 || null,
        notes: normalized.notes || null, // Notes are preserved as-is
      },
    });

    return {
      success: true,
      id,
    };
  },
  zod$({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    companyName: z.string().optional(),
    phone1: z.string().min(1, 'Primary phone is required'),
    phone2: z.string().optional(),
    email1: z.string().email('Invalid email').optional().or(z.literal('')),
    email2: z.string().email('Invalid email').optional().or(z.literal('')),
    notes: z.string().optional(),
  }),
);

export default component$(() => {
  const contact = useEditContactLoader();
  const action = useUpdateContact();
  const nav = useNavigate();
  const loc = useLocation();

  // Return to returnTo URL or waitlist after submission
  useVisibleTask$(({ track }) => {
    const result = track(() => action.value);
    if (result?.success) {
      const returnTo = loc.url.searchParams.get('returnTo');
      if (returnTo) {
        setTimeout(() => nav(decodeURIComponent(returnTo)), 1000);
      } else {
        setTimeout(() => nav(`/waitlist`), 1000);
      }
    }
  });

  return (
    <section>
      <PageSubtitle text="Edit Contact" />

      <div class="my-3">
        <BackButton />
      </div>

      <div class="card max-w-lg">
        <Form action={action} class="space-y-4">
          {/* First Name */}
          <div>
            <label
              class="block text-sm font-medium mb-2"
              style="color: rgb(var(--color-text-secondary))"
            >
              First Name *
            </label>
            <input
              name="firstName"
              type="text"
              class="w-full"
              value={contact.value.firstName}
              required
            />
          </div>

          {/* Last Name */}
          <div>
            <label
              class="block text-sm font-medium mb-2"
              style="color: rgb(var(--color-text-secondary))"
            >
              Last Name *
            </label>
            <input
              name="lastName"
              type="text"
              class="w-full"
              value={contact.value.lastName}
              required
            />
          </div>

          {/* Company Name */}
          <div>
            <label
              class="block text-sm font-medium mb-2"
              style="color: rgb(var(--color-text-secondary))"
            >
              Company Name
            </label>
            <input
              name="companyName"
              type="text"
              class="w-full"
              value={contact.value.companyName || ''}
            />
          </div>

          {/* Phone 1 */}
          <div>
            <label
              class="block text-sm font-medium mb-2"
              style="color: rgb(var(--color-text-secondary))"
            >
              Primary Phone *
            </label>
            <input
              name="phone1"
              type="tel"
              class="w-full"
              value={contact.value.phone1}
              required
            />
          </div>

          {/* Phone 2 */}
          <div>
            <label
              class="block text-sm font-medium mb-2"
              style="color: rgb(var(--color-text-secondary))"
            >
              Secondary Phone
            </label>
            <input
              name="phone2"
              type="tel"
              class="w-full"
              value={contact.value.phone2 || ''}
            />
          </div>

          {/* Email 1 */}
          <div>
            <label
              class="block text-sm font-medium mb-2"
              style="color: rgb(var(--color-text-secondary))"
            >
              Primary Email
            </label>
            <input
              name="email1"
              type="email"
              class="w-full"
              value={contact.value.email1 || ''}
            />
          </div>

          {/* Email 2 */}
          <div>
            <label
              class="block text-sm font-medium mb-2"
              style="color: rgb(var(--color-text-secondary))"
            >
              Secondary Email
            </label>
            <input
              name="email2"
              type="email"
              class="w-full"
              value={contact.value.email2 || ''}
            />
          </div>

          {/* Notes */}
          <div>
            <label
              class="block text-sm font-medium mb-2"
              style="color: rgb(var(--color-text-secondary))"
            >
              Notes
            </label>
            <textarea name="notes" rows={4} class="w-full">
              {contact.value.notes || ''}
            </textarea>
          </div>

          <div class="flex justify-end gap-3">
            <a
              href={loc.url.searchParams.get('returnTo') || '/waitlist'}
              class="btn btn-ghost"
            >
              Cancel
            </a>
            <button
              type="submit"
              class="btn btn-primary"
              disabled={action.isRunning}
            >
              {action.isRunning ? 'Updating...' : 'Update Contact'}
            </button>
          </div>
        </Form>
      </div>

      {action.value?.success && (
        <div
          class="mt-4 p-3 rounded-lg"
          style="background-color: rgb(var(--color-success) / 0.1); color: rgb(var(--color-success))"
        >
          Contact updated! Redirecting...
        </div>
      )}

      {action.value?.fieldErrors && (
        <div
          class="mt-4 p-3 rounded-lg"
          style="background-color: rgb(var(--color-error) / 0.1); color: rgb(var(--color-error))"
        >
          Please fix the errors above.
        </div>
      )}
    </section>
  );
});
