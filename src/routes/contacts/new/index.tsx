import {
  component$,
  useVisibleTask$,
} from '@builder.io/qwik';
import {
  routeAction$,
  z,
  zod$,
  Form,
  useNavigate,
  useLocation,
} from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import PageSubtitle from '~/components/PageSubtitle';
import BackButton from '~/components/BackButton';

export const useCreateContact = routeAction$(
  async (values) => {
    const contact = await db.contact.create({
      data: {
        firstName: values.firstName,
        lastName: values.lastName,
        companyName: values.companyName || null,
        phone1: values.phone1,
        phone2: values.phone2 || null,
        email1: values.email1 || null,
        email2: values.email2 || null,
        notes: values.notes || null,
      },
    });

    return {
      success: true,
      id: contact.id,
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
  const action = useCreateContact();
  const nav = useNavigate();
  const loc = useLocation();

  // Return to returnTo URL or waitlist after submission
  useVisibleTask$(({ track }) => {
    const result = track(() => action.value);
    if (result?.success) {
      console.log('Contact created!');
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
      <PageSubtitle text="New Contact" />

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
            <input name="firstName" type="text" class="w-full" required />
          </div>

          {/* Last Name */}
          <div>
            <label
              class="block text-sm font-medium mb-2"
              style="color: rgb(var(--color-text-secondary))"
            >
              Last Name *
            </label>
            <input name="lastName" type="text" class="w-full" required />
          </div>

          {/* Company Name */}
          <div>
            <label
              class="block text-sm font-medium mb-2"
              style="color: rgb(var(--color-text-secondary))"
            >
              Company Name
            </label>
            <input name="companyName" type="text" class="w-full" />
          </div>

          {/* Phone 1 */}
          <div>
            <label
              class="block text-sm font-medium mb-2"
              style="color: rgb(var(--color-text-secondary))"
            >
              Primary Phone *
            </label>
            <input name="phone1" type="tel" class="w-full" required />
          </div>

          {/* Phone 2 */}
          <div>
            <label
              class="block text-sm font-medium mb-2"
              style="color: rgb(var(--color-text-secondary))"
            >
              Secondary Phone
            </label>
            <input name="phone2" type="tel" class="w-full" />
          </div>

          {/* Email 1 */}
          <div>
            <label
              class="block text-sm font-medium mb-2"
              style="color: rgb(var(--color-text-secondary))"
            >
              Primary Email
            </label>
            <input name="email1" type="email" class="w-full" />
          </div>

          {/* Email 2 */}
          <div>
            <label
              class="block text-sm font-medium mb-2"
              style="color: rgb(var(--color-text-secondary))"
            >
              Secondary Email
            </label>
            <input name="email2" type="email" class="w-full" />
          </div>

          {/* Notes */}
          <div>
            <label
              class="block text-sm font-medium mb-2"
              style="color: rgb(var(--color-text-secondary))"
            >
              Notes
            </label>
            <textarea name="notes" rows={4} class="w-full"></textarea>
          </div>

          <button
            type="submit"
            class="btn btn-primary"
            disabled={action.isRunning}
          >
            {action.isRunning ? 'Saving...' : 'Save Contact'}
          </button>
        </Form>
      </div>

      {action.value?.success && (
        <div
          class="mt-4 p-3 rounded-lg"
          style="background-color: rgb(var(--color-success) / 0.1); color: rgb(var(--color-success))"
        >
          Contact created! Redirecting...
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
