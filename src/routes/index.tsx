import { component$ } from '@builder.io/qwik';
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import PageSubtitle from '~/components/PageSubtitle';
import PageTitle from '~/components/PageTitle';

export const useDashboardLoader = routeLoader$(async ({ query }) => {
  const sortOrder = query.get('waitlistSort') || 'oldest';
  const order = sortOrder === 'newest' ? 'desc' : 'asc';

  const waitlistEntries = await db.waitlistEntry.findMany({
    where: {
      status: 'waiting',
    },
    include: {
      contact: true,
      vendorProduct: {
        include: {
          vendor: true,
        },
      },
    },
    orderBy: {
      createdAt: order,
    },
    take: 10,
  });

  return {
    waitlistEntries,
    sortOrder,
  };
});

export default component$(() => {
  const data = useDashboardLoader();

  // Format date as MM/DD/YY
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
    });
  };

  return (
    <div class="container mx-auto p-6">
      <PageTitle text="Dashboard" />

      {/* Notices Section */}
      <section class="mb-8">
        <div class="card">
          <div
            class="card-header"
            style="background: linear-gradient(135deg, rgb(var(--color-primary) / 0.1), rgb(var(--color-secondary) / 0.1))"
          >
            <PageSubtitle text="Notices" />
          </div>

          {/* Notices placeholder listing */}
          <div class="space-y-4">
            <div
              class="flex items-start space-x-3 p-4 rounded-lg border-l-4"
              style="background-color: rgb(var(--color-warning) / 0.1); border-color: rgb(var(--color-warning))"
            >
              <div
                class="flex-shrink-0 w-2 h-2 rounded-full mt-2"
                style="background-color: rgb(var(--color-warning))"
              ></div>
              <div>
                <p
                  class="text-sm"
                  style="color: rgb(var(--color-text-primary))"
                >
                  <span
                    class="font-medium"
                    style="color: rgb(var(--color-warning))"
                  >
                    6/23/2025:
                  </span>{' '}
                  Waiting on Cherry Blend to come in for Larry Williams (see
                  waitlist)
                </p>
              </div>
            </div>
            <div
              class="flex items-start space-x-3 p-4 rounded-lg border-l-4"
              style="background-color: rgb(var(--color-success) / 0.1); border-color: rgb(var(--color-success))"
            >
              <div
                class="flex-shrink-0 w-2 h-2 rounded-full mt-2"
                style="background-color: rgb(var(--color-success))"
              ></div>
              <div>
                <p
                  class="text-sm"
                  style="color: rgb(var(--color-text-primary))"
                >
                  <span
                    class="font-medium"
                    style="color: rgb(var(--color-success))"
                  >
                    6/21/2025:
                  </span>{' '}
                  John Doe did pay his outstanding balance (okay to sign again.)
                </p>
              </div>
            </div>
            <div
              class="flex items-start space-x-3 p-4 rounded-lg border-l-4"
              style="background-color: rgb(var(--color-danger) / 0.1); border-color: rgb(var(--color-danger))"
            >
              <div
                class="flex-shrink-0 w-2 h-2 rounded-full mt-2"
                style="background-color: rgb(var(--color-danger))"
              ></div>
              <div>
                <p
                  class="text-sm"
                  style="color: rgb(var(--color-text-primary))"
                >
                  <span
                    class="font-medium"
                    style="color: rgb(var(--color-danger))"
                  >
                    6/20/2025:
                  </span>{' '}
                  NO deliveries for Kelly this Friday the 25th.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist Section */}
      <section class="mb-8">
        <div class="card">
          <div
            class="card-header flex items-center justify-between"
            style="background: linear-gradient(135deg, rgb(var(--color-accent) / 0.1), rgb(var(--color-primary) / 0.1))"
          >
            <div>
              <PageSubtitle text="Waitlist" />
              <p class="card-subtitle">
                {data.value.sortOrder === 'newest' ? 'Newest' : 'Oldest'} 10 waiting entries
              </p>
            </div>
            <select
              class="text-sm px-3 py-1 rounded"
              style="background-color: rgb(var(--color-bg-primary)); border: 1px solid rgb(var(--color-border)); color: rgb(var(--color-text-primary))"
              value={data.value.sortOrder}
              onChange$={(e) => {
                const newSort = (e.target as HTMLSelectElement).value;
                const url = new URL(window.location.href);
                url.searchParams.set('waitlistSort', newSort);
                window.location.href = url.toString();
              }}
            >
              <option value="oldest">Oldest First</option>
              <option value="newest">Newest First</option>
            </select>
          </div>

          {/* Waitlist Table */}
          <div class="table-container overflow-x-auto">
            {data.value.waitlistEntries.length > 0 ? (
              <table class="table-modern">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Contact</th>
                    <th>Resource</th>
                    <th>Quantity</th>
                    <th>Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {data.value.waitlistEntries.map((entry) => (
                    <tr
                      key={entry.id}
                      class="cursor-pointer"
                      onClick$={() => {
                        window.location.href = `/waitlist/${entry.id}/edit`;
                      }}
                    >
                      <td>{formatDate(entry.createdAt)}</td>
                      <td>
                        {entry.contact.firstName} {entry.contact.lastName}
                      </td>
                      <td>
                        {entry.resourceType === 'vendor_product'
                          ? entry.vendorProduct?.name || 'N/A'
                          : entry.customResourceName}
                      </td>
                      <td>
                        {entry.quantity}
                        {entry.quantityUnit ? ` ${entry.quantityUnit}` : ''}
                      </td>
                      <td>{entry.contact.phone1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div class="p-8 text-center">
                <p style="color: rgb(var(--color-text-secondary))">
                  No waiting entries found
                </p>
              </div>
            )}
          </div>

          {/* View All Link */}
          {data.value.waitlistEntries.length > 0 && (
            <div class="p-4 text-center" style="border-top: 1px solid rgb(var(--color-border))">
              <a
                href="/waitlist"
                class="text-sm"
                style="color: rgb(var(--color-accent))"
              >
                View all waitlist entries →
              </a>
            </div>
          )}
        </div>
      </section>
    </div>
  );
});

export const head: DocumentHead = {
  title: 'CHLM Dashboard',
  meta: [
    {
      name: 'description',
      content: 'Internal company dashboard for CHLM employees',
    },
  ],
};
