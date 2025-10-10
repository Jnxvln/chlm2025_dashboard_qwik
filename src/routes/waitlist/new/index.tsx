import {
  component$,
  useSignal,
  useVisibleTask$,
} from '@builder.io/qwik';
import {
  routeAction$,
  z,
  zod$,
  Form,
  routeLoader$,
  useNavigate,
  useLocation,
} from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import PageSubtitle from '~/components/PageSubtitle';
import BackButton from '~/components/BackButton';
import { SearchableSelect } from '~/components/waitlist/SearchableSelect';

export const useWaitlistNewLoader = routeLoader$(async () => {
  const [contacts, vendorProducts] = await Promise.all([
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

  return {
    contacts,
    vendorProducts,
  };
});

export const useCreateWaitlistEntry = routeAction$(
  async (values) => {
    const resourceType = values.resourceType;

    const waitlistEntry = await db.waitlistEntry.create({
      data: {
        contactId: parseInt(values.contactId),
        resourceType,
        vendorProductId: resourceType === 'vendor_product' ? parseInt(values.vendorProductId!) : null,
        customResourceName: resourceType === 'custom' ? values.customResourceName! : null,
        quantity: parseInt(values.quantity),
        quantityUnit: values.quantityUnit || null,
        status: values.status as any,
        contactedAt: values.contactedAt ? new Date(values.contactedAt) : null,
        notes: values.notes || null,
      },
    });

    return {
      success: true,
      id: waitlistEntry.id,
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
  const data = useWaitlistNewLoader();
  const action = useCreateWaitlistEntry();
  const nav = useNavigate();
  const loc = useLocation();

  const resourceType = useSignal<'vendor_product' | 'custom'>('vendor_product');
  const selectedContactId = useSignal<string>('');
  const selectedVendorProductId = useSignal<string>('');
  const customResourceName = useSignal<string>('');
  const selectedStatus = useSignal<string>('waiting');

  // Return to waitlist after submission
  useVisibleTask$(({ track }) => {
    const result = track(() => action.value);
    if (result?.success) {
      console.log('Waitlist entry created!');
      setTimeout(() => nav(`/waitlist`), 1000);
    }
  });

  return (
    <section>
      <PageSubtitle text="New Waitlist Entry" />

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
              value={selectedContactId.value}
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
              value={selectedVendorProductId.value}
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
                value={customResourceName.value}
                onInput$={(e) => {
                  customResourceName.value = (e.target as HTMLInputElement).value;
                }}
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
            <select name="quantityUnit" class="w-full">
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
              />
              <p class="text-xs mt-1" style="color: rgb(var(--color-text-tertiary))">
                Leave empty to use current date/time
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
            <textarea name="notes" rows={4} class="w-full"></textarea>
          </div>

          <button
            type="submit"
            class="btn btn-primary"
            disabled={action.isRunning}
          >
            {action.isRunning ? 'Saving...' : 'Save Waitlist Entry'}
          </button>
        </Form>
      </div>

      {action.value?.success && (
        <div
          class="mt-4 p-3 rounded-lg"
          style="background-color: rgb(var(--color-success) / 0.1); color: rgb(var(--color-success))"
        >
          Waitlist entry created! Redirecting...
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
