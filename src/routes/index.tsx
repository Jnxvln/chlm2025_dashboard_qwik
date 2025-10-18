import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import PageSubtitle from '~/components/PageSubtitle';
import PageTitle from '~/components/PageTitle';
import { NoticeBoard } from '~/components/notices/NoticeBoard';

export const useDashboardLoader = routeLoader$(async ({ query }) => {
  const waitlistSortOrder = query.get('waitlistSort') || 'oldest';
  const waitlistOrder = waitlistSortOrder === 'newest' ? 'desc' : 'asc';

  const noticeSortOrder = query.get('noticeSort') || 'newest';
  const noticeOrder = noticeSortOrder === 'newest' ? 'desc' : 'asc';

  const noticeTypeFilter = query.get('noticeType') || 'all';

  // Fetch waitlist entries
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
      createdAt: waitlistOrder,
    },
    take: 10,
  });

  // Fetch notices (only show notices where displayDate <= today)
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today

  const noticeWhere: any = {
    displayDate: {
      lte: today,
    },
  };

  if (noticeTypeFilter !== 'all') {
    noticeWhere.type = noticeTypeFilter;
  }

  const notices = await db.notice.findMany({
    where: noticeWhere,
    include: {
      urls: true,
    },
    orderBy: {
      displayDate: noticeOrder,
    },
    take: 10,
  });

  return {
    waitlistEntries,
    sortOrder: waitlistSortOrder,
    notices,
    noticeSortOrder,
    noticeTypeFilter,
  };
});

export default component$(() => {
  const data = useDashboardLoader();

  // Hover tooltip states
  const hoveredNote = useSignal<number | null>(null);
  const tooltipPosition = useSignal<{ x: number; y: number }>({ x: 0, y: 0 });
  const hideTooltipTimeout = useSignal<number | null>(null);

  // Load saved notice preferences from localStorage on mount
  useVisibleTask$(() => {
    const url = new URL(window.location.href);
    const hasNoticeParams = url.searchParams.has('noticeSort') || url.searchParams.has('noticeType');

    // If URL has params, save them to localStorage
    if (hasNoticeParams) {
      const noticeSort = url.searchParams.get('noticeSort') || 'newest';
      const noticeType = url.searchParams.get('noticeType') || 'all';
      localStorage.setItem('noticeSort', noticeSort);
      localStorage.setItem('noticeType', noticeType);
    } else {
      // If no URL params, check localStorage and redirect if preferences exist
      const savedSort = localStorage.getItem('noticeSort');
      const savedType = localStorage.getItem('noticeType');

      if (savedSort || savedType) {
        if (savedSort) url.searchParams.set('noticeSort', savedSort);
        if (savedType) url.searchParams.set('noticeType', savedType);
        window.location.href = url.toString();
      }
    }
  });

  // Format date as MM/DD/YY HH:MM AM/PM
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const datePart = d.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
    });
    const timePart = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${datePart} ${timePart}`;
  };

  // Format status with colors
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      waiting: { label: 'Waiting', color: 'badge-warning' },
      contacted: { label: 'Contacted', color: 'badge-info' },
      fulfilled: { label: 'Fulfilled', color: 'badge-success' },
      cancelled: { label: 'Cancelled', color: 'badge-danger' },
    };
    const config = statusMap[status] || { label: status, color: '' };
    return <span class={`badge ${config.color}`}>{config.label}</span>;
  };

  // Note tooltip component with fixed positioning
  const NoteTooltip = component$(({ note, x, y }: any) => (
    <div
      class="fixed z-[9999] p-3 rounded-lg shadow-xl border"
      style={`background-color: rgb(var(--color-bg-primary)); border-color: rgb(var(--color-border)); min-width: 200px; max-width: 400px; left: ${x + 10}px; top: ${y + 10}px;`}
      onMouseEnter$={() => {
        // Cancel any pending hide
        if (hideTooltipTimeout.value) {
          clearTimeout(hideTooltipTimeout.value);
          hideTooltipTimeout.value = null;
        }
      }}
      onMouseLeave$={() => {
        // Hide the tooltip when mouse leaves
        hoveredNote.value = null;
      }}
    >
      <div class="text-sm" style="color: rgb(var(--color-text-secondary)); white-space: pre-wrap;">
        {note}
      </div>
    </div>
  ));

  return (
    <div class="container mx-auto p-6">
      <PageTitle text="Dashboard" />

      {/* Notices Section */}
      <section class="mb-8">
        <NoticeBoard
          notices={data.value.notices}
          sortOrder={data.value.noticeSortOrder}
          typeFilter={data.value.noticeTypeFilter}
        />
        {data.value.notices.length > 0 && (
          <div class="mt-4 text-center">
            <a
              href="/notices"
              class="text-sm"
              style="color: rgb(var(--color-accent))"
            >
              View all notices →
            </a>
          </div>
        )}
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
                    <th>Status</th>
                    <th class="text-center">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {data.value.waitlistEntries.map((entry) => (
                    <tr
                      key={entry.id}
                      class="cursor-pointer"
                      onClick$={() => {
                        window.location.href = `/waitlist/${entry.id}/edit?returnTo=${encodeURIComponent('/')}`;
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
                      <td>{getStatusBadge(entry.status)}</td>
                      <td class="text-center">
                        {entry.notes ? (
                          <span
                            class="cursor-help"
                            style="color: rgb(var(--color-accent)); font-size: 1.25rem;"
                            onMouseEnter$={(e) => {
                              // Cancel any pending hide
                              if (hideTooltipTimeout.value) {
                                clearTimeout(hideTooltipTimeout.value);
                                hideTooltipTimeout.value = null;
                              }
                              hoveredNote.value = entry.id;
                              tooltipPosition.value = { x: e.clientX, y: e.clientY };
                            }}
                            onMouseLeave$={() => {
                              // Delay hiding to allow mouse to move to tooltip
                              hideTooltipTimeout.value = window.setTimeout(() => {
                                hoveredNote.value = null;
                              }, 200);
                            }}
                          >
                            📝
                          </span>
                        ) : (
                          <span style="color: rgb(var(--color-text-disabled))">—</span>
                        )}
                      </td>
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

      {/* Render tooltip at root level to avoid overflow clipping */}
      {hoveredNote.value !== null && (
        <NoteTooltip
          note={data.value.waitlistEntries.find((e) => e.id === hoveredNote.value)?.notes}
          x={tooltipPosition.value.x}
          y={tooltipPosition.value.y}
        />
      )}
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
