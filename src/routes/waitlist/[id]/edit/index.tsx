import {
  component$,
  useSignal,
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
import { SearchableSelect } from '~/components/waitlist/SearchableSelect';

export const useEditWaitlistEntryLoader = routeLoader$(async (event) => {
  const id = parseInt(event.params.id);

  const [waitlistEntry, contacts, vendorProducts] = await Promise.all([
    db.waitlistEntry.findUnique({
      where: { id },
      include: {
        contact: true,
        vendorProduct: {
          include: {
            vendor: true,
            vendorLocation: true,
          },
        },
      },
    }),
    db.contact.findMany({
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    }),
    db.vendorProduct.findMany({
      where: { isActive: true },
      include: {
        vendor: true,
        vendorLocation: true,
      },
      orderBy: [{ name: 'asc' }],
    }),
  ]);

  if (!waitlistEntry) {
    throw event.error(404, 'Waitlist entry not found');
  }

  return {
    waitlistEntry,
    contacts,
    vendorProducts,
  };
});

export const useUpdateWaitlistEntry = routeAction$(
  async (values, event) => {
    const id = parseInt(event.params.id);
    const resourceType = values.resourceType;

    await db.waitlistEntry.update({
      where: { id },
      data: {
        contactId: parseInt(values.contactId),
        resourceType,
        vendorProductId: resourceType === 'vendor_product' ? parseInt(values.vendorProductId!) : null,
        customResourceName: resourceType === 'custom' ? values.customResourceName! : null,
        quantity: parseInt(values.quantity),
        quantityUnit: values.quantityUnit || null,
        status: values.status as any,
        notes: values.notes || null,
        contactedAt: values.contactedAt ? new Date(values.contactedAt) : null,
      },
    });

    return {
      success: true,
      id,
    };
  },
  zod$({
    contactId: z.string().min(1, 'Contact is required'),
    resourceType: z.enum(['vendor_product', 'custom']),
    vendorProductId: z.string().optional(),
    customResourceName: z.string().optional(),
    quantity: z.string().min(1, 'Quantity is required').refine((val) => !isNaN(parseInt(val)), {
      message: 'Must be a number',
    }),
    quantityUnit: z.string().optional(),
    status: z.string().min(1),
    contactedAt: z.string().optional(),
    notes: z.string().optional(),
  }),
);

export default component$(() => {
  const data = useEditWaitlistEntryLoader();
  const action = useUpdateWaitlistEntry();
  const nav = useNavigate();
  const loc = useLocation();

  const resourceType = useSignal<'vendor_product' | 'custom'>(
    data.value.waitlistEntry.resourceType as any
  );
  const selectedStatus = useSignal<string>(data.value.waitlistEntry.status);

  // Return to returnTo URL or waitlist after submission
  useVisibleTask$(({ track }) => {
    const result = track(() => action.value);
    if (result?.success) {
      console.log('Waitlist entry updated!');
      const returnTo = loc.url.searchParams.get('returnTo') || '/waitlist';
      setTimeout(() => nav(returnTo), 1000);
    }
  });

  const entry = data.value.waitlistEntry;

  return (
    <section>
      <PageSubtitle text="Edit Waitlist Entry" />

      <div class="my-3">
        <BackButton />
      </div>

      <div class="card max-w-lg">
        <Form action={action} class="space-y-4">
          {/* Contact */}
          <div>
            <SearchableSelect
              name="contactId"
              label="Contact"
              required
              placeholder="Search for a contact..."
              options={data.value.contacts.map((contact) => ({
                value: contact.id,
                label: `${contact.firstName} ${contact.lastName}${contact.companyName ? ` (${contact.companyName})` : ''}`,
              }))}
              value={String(entry.contactId)}
            />
            <div class="mt-2">
              <a
                href={`/contacts/new?returnTo=${encodeURIComponent(loc.url.pathname)}`}
                class="text-sm"
                style="color: rgb(var(--color-accent))"
              >
                + Create new contact
              </a>
            </div>
          </div>

          {/* Resource Type */}
          <div>
            <label
              class="block text-sm font-medium mb-2"
              style="color: rgb(var(--color-text-secondary))"
            >
              Resource Type *
            </label>
            <div class="flex gap-4">
              <label class="flex items-center gap-2">
                <input
                  type="radio"
                  name="resourceType"
                  value="vendor_product"
                  checked={resourceType.value === 'vendor_product'}
                  onChange$={() => {
                    resourceType.value = 'vendor_product';
                  }}
                  style="accent-color: rgb(var(--color-primary))"
                />
                <span
                  class="text-sm"
                  style="color: rgb(var(--color-text-primary))"
                >
                  Product from inventory
                </span>
              </label>
              <label class="flex items-center gap-2">
                <input
                  type="radio"
                  name="resourceType"
                  value="custom"
                  checked={resourceType.value === 'custom'}
                  onChange$={() => {
                    resourceType.value = 'custom';
                  }}
                  style="accent-color: rgb(var(--color-primary))"
                />
                <span
                  class="text-sm"
                  style="color: rgb(var(--color-text-primary))"
                >
                  Custom item
                </span>
              </label>
            </div>
          </div>

          {/* Vendor Product (conditional) */}
          {resourceType.value === 'vendor_product' && (
            <SearchableSelect
              name="vendorProductId"
              label="Product"
              required={resourceType.value === 'vendor_product'}
              placeholder="Search for a product..."
              options={data.value.vendorProducts.map((product) => ({
                value: product.id,
                label: `${product.name} (${product.vendor.shortName} - ${product.vendorLocation.name})`,
              }))}
              value={String(entry.vendorProductId || '')}
            />
          )}

          {/* Custom Resource Name (conditional) */}
          {resourceType.value === 'custom' && (
            <div>
              <label
                class="block text-sm font-medium mb-2"
                style="color: rgb(var(--color-text-secondary))"
              >
                Custom Resource Name *
              </label>
              <input
                name="customResourceName"
                type="text"
                class="w-full"
                required={resourceType.value === 'custom'}
                value={entry.customResourceName || ''}
                placeholder="e.g., Ground cover rolls, Metal ground pins, Feed sacks"
              />
            </div>
          )}

          {/* Quantity */}
          <div>
            <label
              class="block text-sm font-medium mb-2"
              style="color: rgb(var(--color-text-secondary))"
            >
              Quantity *
            </label>
            <input
              name="quantity"
              type="number"
              class="w-full"
              required
              min="1"
              value={entry.quantity}
            />
          </div>

          {/* Quantity Unit */}
          <div>
            <label
              class="block text-sm font-medium mb-2"
              style="color: rgb(var(--color-text-secondary))"
            >
              Quantity Unit
            </label>
            <select name="quantityUnit" class="w-full" value={entry.quantityUnit || ''}>
              <option value="">None (just a number)</option>
              <option value="lbs">lbs (pounds)</option>
              <option value="yds">yds (yards)</option>
              <option value="ea">ea (each)</option>
              <option value="tons">tons</option>
              <option value="ft">ft (feet)</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label
              class="block text-sm font-medium mb-2"
              style="color: rgb(var(--color-text-secondary))"
            >
              Status *
            </label>
            <select
              name="status"
              class="w-full"
              required
              value={selectedStatus.value}
              onChange$={(e) => {
                selectedStatus.value = (e.target as HTMLSelectElement).value;
              }}
            >
              <option value="waiting">Waiting</option>
              <option value="contacted">Contacted</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Contacted At (conditional) */}
          {(selectedStatus.value === 'contacted' ||
            selectedStatus.value === 'fulfilled' ||
            selectedStatus.value === 'cancelled') && (
            <div>
              <label
                class="block text-sm font-medium mb-2"
                style="color: rgb(var(--color-text-secondary))"
              >
                {selectedStatus.value === 'contacted' ? 'Date Contacted' :
                 selectedStatus.value === 'fulfilled' ? 'Date Fulfilled' :
                 'Date Cancelled'}
              </label>
              <input
                name="contactedAt"
                type="datetime-local"
                class="w-full"
                value={
                  entry.contactedAt
                    ? new Date(entry.contactedAt).toISOString().slice(0, 16)
                    : ''
                }
              />
              <p class="text-xs mt-1" style="color: rgb(var(--color-text-tertiary))">
                Leave empty to clear date/time
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label
              class="block text-sm font-medium mb-2"
              style="color: rgb(var(--color-text-secondary))"
            >
              Notes
            </label>
            <textarea name="notes" rows={4} class="w-full">
              {entry.notes || ''}
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
              {action.isRunning ? 'Updating...' : 'Update Waitlist Entry'}
            </button>
          </div>
        </Form>
      </div>

      {action.value?.success && (
        <div
          class="mt-4 p-3 rounded-lg"
          style="background-color: rgb(var(--color-success) / 0.1); color: rgb(var(--color-success))"
        >
          Waitlist entry updated! Redirecting...
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
