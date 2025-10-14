import { $, component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import { routeAction$, routeLoader$, useLocation, useNavigate, zod$, z } from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import PageTitle from '~/components/PageTitle';
import { EditIcon, DeleteIcon } from '~/components/icons';

export const useWaitlistLoader = routeLoader$(async ({ query }) => {
  const page = parseInt(query.get('page') || '1');
  const contactPage = parseInt(query.get('contactPage') || '1');
  const search = query.get('search') || '';
  const contactSearch = query.get('contactSearch') || '';
  const sortBy = query.get('sortBy') || 'createdAt';
  const sortOrder = query.get('sortOrder') || 'asc';

  const pageSize = 10;
  const contactPageSize = 10;

  // Build where clause for waitlist entries
  const where: any = {};
  if (search) {
    const orConditions: any[] = [
      { contact: { firstName: { contains: search, mode: 'insensitive' } } },
      { contact: { lastName: { contains: search, mode: 'insensitive' } } },
      { customResourceName: { contains: search, mode: 'insensitive' } },
      { vendorProduct: { name: { contains: search, mode: 'insensitive' } } },
    ];

    // Check if search matches any status values (enum doesn't support contains)
    const statusValues = ['waiting', 'contacted', 'fulfilled', 'cancelled'];
    const matchingStatuses = statusValues.filter(status =>
      status.toLowerCase().includes(search.toLowerCase())
    );

    if (matchingStatuses.length > 0) {
      orConditions.push({ status: { in: matchingStatuses } });
    }

    where.OR = orConditions;
  }

  // Build where clause for contacts
  const contactWhere: any = {};
  if (contactSearch) {
    contactWhere.OR = [
      { firstName: { contains: contactSearch, mode: 'insensitive' } },
      { lastName: { contains: contactSearch, mode: 'insensitive' } },
      { companyName: { contains: contactSearch, mode: 'insensitive' } },
      { phone1: { contains: contactSearch } },
      { email1: { contains: contactSearch, mode: 'insensitive' } },
    ];
  }

  const [waitlistEntries, totalWaitlistEntries, contacts, totalContacts] = await Promise.all([
    db.waitlistEntry.findMany({
      where,
      include: {
        contact: true,
        vendorProduct: {
          include: {
            vendor: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.waitlistEntry.count({ where }),
    db.contact.findMany({
      where: contactWhere,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      skip: (contactPage - 1) * contactPageSize,
      take: contactPageSize,
    }),
    db.contact.count({ where: contactWhere }),
  ]);

  return {
    waitlistEntries,
    totalWaitlistEntries,
    waitlistPage: page,
    waitlistTotalPages: Math.ceil(totalWaitlistEntries / pageSize),
    contacts,
    totalContacts,
    contactPage,
    contactTotalPages: Math.ceil(totalContacts / contactPageSize),
    search,
    contactSearch,
    sortBy,
    sortOrder,
  };
});

export const useDeleteWaitlistEntry = routeAction$(
  async ({ id }) => {
    await db.waitlistEntry.delete({
      where: { id: parseInt(id) },
    });
    return { success: true };
  },
  zod$({
    id: z.string(),
  })
);

export const useDeleteContact = routeAction$(
  async ({ id }) => {
    // Get waitlist entries count for this contact
    const entriesCount = await db.waitlistEntry.count({
      where: { contactId: parseInt(id) },
    });

    // Delete will cascade to waitlist entries
    await db.contact.delete({
      where: { id: parseInt(id) },
    });

    return { success: true, deletedEntries: entriesCount };
  },
  zod$({
    id: z.string(),
  })
);

export default component$(() => {
  const data = useWaitlistLoader();
  const deleteWaitlistAction = useDeleteWaitlistEntry();
  const deleteContactAction = useDeleteContact();
  const nav = useNavigate();
  const loc = useLocation();

  const searchInput = useSignal(data.value.search);
  const contactSearchInput = useSignal(data.value.contactSearch);
  const searchDebounceTimer = useSignal<number | null>(null);
  const contactSearchDebounceTimer = useSignal<number | null>(null);

  // Hover tooltip states
  const hoveredContact = useSignal<number | null>(null);
  const hoveredWaitlistContact = useSignal<number | null>(null);
  const hoveredNote = useSignal<number | null>(null);
  const tooltipPosition = useSignal<{ x: number; y: number }>({ x: 0, y: 0 });
  const hideTooltipTimeout = useSignal<number | null>(null);

  // Load sorting preferences from localStorage
  useVisibleTask$(() => {
    const savedSort = localStorage.getItem('waitlist-sort');
    if (savedSort && !loc.url.searchParams.has('sortBy')) {
      const { sortBy, sortOrder } = JSON.parse(savedSort);
      const url = new URL(window.location.href);
      url.searchParams.set('sortBy', sortBy);
      url.searchParams.set('sortOrder', sortOrder);
      window.location.href = url.toString();
    }
  });

  // Debounced search handler for waitlist
  const handleSearch$ = $((value: string) => {
    if (searchDebounceTimer.value) {
      clearTimeout(searchDebounceTimer.value);
    }

    searchDebounceTimer.value = window.setTimeout(() => {
      const url = new URL(window.location.href);
      if (value) {
        url.searchParams.set('search', value);
      } else {
        url.searchParams.delete('search');
      }
      url.searchParams.set('page', '1'); // Reset to first page
      window.location.href = url.toString();
    }, 500);
  });

  // Debounced search handler for contacts
  const handleContactSearch$ = $((value: string) => {
    if (contactSearchDebounceTimer.value) {
      clearTimeout(contactSearchDebounceTimer.value);
    }

    contactSearchDebounceTimer.value = window.setTimeout(() => {
      const url = new URL(window.location.href);
      if (value) {
        url.searchParams.set('contactSearch', value);
      } else {
        url.searchParams.delete('contactSearch');
      }
      url.searchParams.set('contactPage', '1'); // Reset to first page
      window.location.href = url.toString();
    }, 500);
  });

  // Sort handler
  const handleSort$ = $((column: string) => {
    const currentSortBy = data.value.sortBy;
    const currentSortOrder = data.value.sortOrder;

    let newSortOrder = 'asc';
    if (currentSortBy === column && currentSortOrder === 'asc') {
      newSortOrder = 'desc';
    }

    // Save to localStorage
    localStorage.setItem('waitlist-sort', JSON.stringify({ sortBy: column, sortOrder: newSortOrder }));

    const url = new URL(window.location.href);
    url.searchParams.set('sortBy', column);
    url.searchParams.set('sortOrder', newSortOrder);
    window.location.href = url.toString();
  });

  // Pagination handlers
  const goToPage$ = $((page: number, type: 'waitlist' | 'contact') => {
    const url = new URL(window.location.href);
    if (type === 'waitlist') {
      url.searchParams.set('page', page.toString());
    } else {
      url.searchParams.set('contactPage', page.toString());
    }
    window.location.href = url.toString();
  });

  // Format date helper
  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
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

  // Contact tooltip component with fixed positioning
  const ContactTooltip = component$(({ contact, showEditButton = false, x, y, isWaitlist = false }: any) => (
    <div
      class="fixed z-[9999] p-3 rounded-lg shadow-xl border"
      style={`background-color: rgb(var(--color-bg-primary)); border-color: rgb(var(--color-border)); min-width: 250px; max-width: 350px; left: ${x + 10}px; top: ${y + 10}px;`}
      onMouseEnter$={() => {
        // Cancel any pending hide
        if (hideTooltipTimeout.value) {
          clearTimeout(hideTooltipTimeout.value);
          hideTooltipTimeout.value = null;
        }
      }}
      onMouseLeave$={() => {
        // Hide the tooltip when mouse leaves
        if (isWaitlist) {
          hoveredWaitlistContact.value = null;
        } else {
          hoveredContact.value = null;
        }
      }}
    >
      <div class="space-y-2 text-sm">
        <div>
          <strong style="color: rgb(var(--color-text-primary))">Name:</strong>{' '}
          <span style="color: rgb(var(--color-text-secondary))">
            {contact.firstName} {contact.lastName}
          </span>
        </div>
        {contact.companyName && (
          <div>
            <strong style="color: rgb(var(--color-text-primary))">Company:</strong>{' '}
            <span style="color: rgb(var(--color-text-secondary))">{contact.companyName}</span>
          </div>
        )}
        <div>
          <strong style="color: rgb(var(--color-text-primary))">Phone 1:</strong>{' '}
          <span style="color: rgb(var(--color-text-secondary))">{contact.phone1}</span>
        </div>
        {contact.phone2 && (
          <div>
            <strong style="color: rgb(var(--color-text-primary))">Phone 2:</strong>{' '}
            <span style="color: rgb(var(--color-text-secondary))">{contact.phone2}</span>
          </div>
        )}
        {contact.email1 && (
          <div>
            <strong style="color: rgb(var(--color-text-primary))">Email 1:</strong>{' '}
            <span style="color: rgb(var(--color-text-secondary))">{contact.email1}</span>
          </div>
        )}
        {contact.email2 && (
          <div>
            <strong style="color: rgb(var(--color-text-primary))">Email 2:</strong>{' '}
            <span style="color: rgb(var(--color-text-secondary))">{contact.email2}</span>
          </div>
        )}
        {contact.notes && (
          <div>
            <strong style="color: rgb(var(--color-text-primary))">Notes:</strong>{' '}
            <span style="color: rgb(var(--color-text-secondary))">{contact.notes}</span>
          </div>
        )}
        {showEditButton && (
          <div class="mt-3 pt-2" style="border-top: 1px solid rgb(var(--color-border))">
            <a
              href={`/contacts/${contact.id}/edit?returnTo=${encodeURIComponent(loc.url.pathname + loc.url.search)}`}
              class="btn btn-sm btn-primary"
            >
              Edit Contact
            </a>
          </div>
        )}
      </div>
    </div>
  ));

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
    <section class="container mx-auto p-6">
      <PageTitle text="Waiting List" />

      {/* Two-column layout */}
      <div class="flex flex-col lg:flex-row gap-6">
        {/* Left column - Waitlist */}
        <div class="flex-1">
          <div class="mb-4 flex flex-wrap gap-3 items-center">
            <a href="/waitlist/new" class="btn btn-primary">
              + New Entry
            </a>
            <input
              type="text"
              placeholder="Search waitlist..."
              class="flex-1 min-w-[200px]"
              value={searchInput.value}
              onInput$={(e) => {
                const value = (e.target as HTMLInputElement).value;
                searchInput.value = value;
                handleSearch$(value);
              }}
            />
          </div>

          {/* Waitlist Table */}
          <div class="card">
            <div class="table-container overflow-x-auto">
              {data.value.waitlistEntries.length > 0 ? (
                <table class="table-modern">
                  <thead>
                    <tr>
                      <th>
                        <button
                          class="flex items-center gap-1"
                          onClick$={() => handleSort$('createdAt')}
                        >
                          Date
                          {data.value.sortBy === 'createdAt' && (
                            <span>{data.value.sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </th>
                      <th>
                        <button
                          class="flex items-center gap-1"
                          onClick$={() => handleSort$('contactId')}
                        >
                          Contact
                          {data.value.sortBy === 'contactId' && (
                            <span>{data.value.sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </th>
                      <th>Resource</th>
                      <th>Qty</th>
                      <th>
                        <button
                          class="flex items-center gap-1"
                          onClick$={() => handleSort$('status')}
                        >
                          Status
                          {data.value.sortBy === 'status' && (
                            <span>{data.value.sortOrder === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </button>
                      </th>
                      <th class="text-center">Notes</th>
                      <th>Last Contacted</th>
                      <th class="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.value.waitlistEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{formatDate(entry.createdAt).split(',')[0]}</td>
                        <td
                          class="cursor-help"
                          onMouseEnter$={(e) => {
                            // Cancel any pending hide
                            if (hideTooltipTimeout.value) {
                              clearTimeout(hideTooltipTimeout.value);
                              hideTooltipTimeout.value = null;
                            }
                            hoveredWaitlistContact.value = entry.contact.id;
                            tooltipPosition.value = { x: e.clientX, y: e.clientY };
                          }}
                          onMouseLeave$={() => {
                            // Delay hiding to allow mouse to move to tooltip
                            hideTooltipTimeout.value = window.setTimeout(() => {
                              hoveredWaitlistContact.value = null;
                            }, 200);
                          }}
                        >
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
                        <td>{formatDate(entry.contactedAt)}</td>
                        <td class="text-center">
                          <div class="flex justify-center items-center gap-1">
                            <button
                              class="btn-icon btn-icon-primary"
                              title="Edit entry"
                              onClick$={() => nav(`/waitlist/${entry.id}/edit`)}
                            >
                              <EditIcon size={16} />
                            </button>
                            <button
                              class="btn-icon btn-icon-danger"
                              title="Delete entry"
                              onClick$={async () => {
                                const confirmed = confirm(
                                  'Are you sure you want to delete this waitlist entry?'
                                );
                                if (!confirmed) return;
                                await deleteWaitlistAction.submit({ id: String(entry.id) });
                                window.location.reload();
                              }}
                            >
                              <DeleteIcon size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div class="p-8 text-center">
                  <p style="color: rgb(var(--color-text-secondary))">No waitlist entries found</p>
                </div>
              )}
            </div>

            {/* Waitlist Pagination */}
            {data.value.waitlistTotalPages > 1 && (
              <div class="flex justify-center items-center gap-2 mt-4 p-4" style="border-top: 1px solid rgb(var(--color-border))">
                <button
                  class="btn btn-sm"
                  disabled={data.value.waitlistPage === 1}
                  onClick$={() => goToPage$(data.value.waitlistPage - 1, 'waitlist')}
                >
                  Previous
                </button>
                <span style="color: rgb(var(--color-text-secondary))">
                  Page {data.value.waitlistPage} of {data.value.waitlistTotalPages}
                </span>
                <button
                  class="btn btn-sm"
                  disabled={data.value.waitlistPage === data.value.waitlistTotalPages}
                  onClick$={() => goToPage$(data.value.waitlistPage + 1, 'waitlist')}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right column - Contacts */}
        <div class="lg:w-80 flex-shrink-0">
          <div class="mb-4 flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold" style="color: rgb(var(--color-text-primary))">
                Contacts
              </h2>
              <a
                href={`/contacts/new?returnTo=${encodeURIComponent(loc.url.pathname + loc.url.search)}`}
                class="btn btn-sm btn-primary"
              >
                + New
              </a>
            </div>

            {/* Contacts Search */}
            <input
              type="text"
              placeholder="Search contacts..."
              class="w-full"
              value={contactSearchInput.value}
              onInput$={(e) => {
                const value = (e.target as HTMLInputElement).value;
                contactSearchInput.value = value;
                handleContactSearch$(value);
              }}
            />
          </div>

          {/* Contacts Table */}
          <div class="card">
            <div class="table-container overflow-x-auto">
              {data.value.contacts.length > 0 ? (
                <table class="table-modern">
                  <thead>
                    <tr>
                      <th
                        class="relative cursor-help"
                        onMouseEnter$={() => {
                          // Tooltip shows on hover
                        }}
                      >
                        First Name
                      </th>
                      <th>Last Name</th>
                      <th class="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.value.contacts.map((contact) => (
                      <tr key={contact.id}>
                        <td
                          class="cursor-help py-2"
                          onMouseEnter$={(e) => {
                            // Cancel any pending hide
                            if (hideTooltipTimeout.value) {
                              clearTimeout(hideTooltipTimeout.value);
                              hideTooltipTimeout.value = null;
                            }
                            hoveredContact.value = contact.id;
                            tooltipPosition.value = { x: e.clientX, y: e.clientY };
                          }}
                          onMouseLeave$={() => {
                            // Delay hiding to allow mouse to move to tooltip
                            hideTooltipTimeout.value = window.setTimeout(() => {
                              hoveredContact.value = null;
                            }, 200);
                          }}
                        >
                          {contact.firstName}
                        </td>
                        <td
                          class="cursor-help py-2"
                          onMouseEnter$={(e) => {
                            // Cancel any pending hide
                            if (hideTooltipTimeout.value) {
                              clearTimeout(hideTooltipTimeout.value);
                              hideTooltipTimeout.value = null;
                            }
                            hoveredContact.value = contact.id;
                            tooltipPosition.value = { x: e.clientX, y: e.clientY };
                          }}
                          onMouseLeave$={() => {
                            // Delay hiding to allow mouse to move to tooltip
                            hideTooltipTimeout.value = window.setTimeout(() => {
                              hoveredContact.value = null;
                            }, 200);
                          }}
                        >
                          {contact.lastName}
                        </td>
                        <td class="text-center py-2">
                          <div class="flex justify-center items-center gap-1">
                            <button
                              class="btn-icon btn-icon-primary"
                              title="Edit contact"
                              onClick$={() =>
                                nav(
                                  `/contacts/${contact.id}/edit?returnTo=${encodeURIComponent(loc.url.pathname + loc.url.search)}`
                                )
                              }
                            >
                              <EditIcon size={16} />
                            </button>
                            <button
                              class="btn-icon btn-icon-danger"
                              title="Delete contact"
                              onClick$={async () => {
                                const confirmed = confirm(
                                  'Are you sure you want to delete this contact?\n\nNote: This will also delete any associated waitlist entries.'
                                );
                                if (!confirmed) return;

                                await deleteContactAction.submit({ id: String(contact.id) });
                                window.location.reload();
                              }}
                            >
                              <DeleteIcon size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div class="p-8 text-center">
                  <p style="color: rgb(var(--color-text-secondary))">No contacts found</p>
                </div>
              )}
            </div>

            {/* Contacts Pagination */}
            {data.value.contactTotalPages > 1 && (
              <div class="flex justify-center items-center gap-2 mt-4 p-4" style="border-top: 1px solid rgb(var(--color-border))">
                <button
                  class="btn btn-sm"
                  disabled={data.value.contactPage === 1}
                  onClick$={() => goToPage$(data.value.contactPage - 1, 'contact')}
                >
                  Previous
                </button>
                <span style="color: rgb(var(--color-text-secondary))">
                  Page {data.value.contactPage} of {data.value.contactTotalPages}
                </span>
                <button
                  class="btn btn-sm"
                  disabled={data.value.contactPage === data.value.contactTotalPages}
                  onClick$={() => goToPage$(data.value.contactPage + 1, 'contact')}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Render tooltips at root level to avoid overflow clipping */}
      {hoveredWaitlistContact.value !== null && (
        <ContactTooltip
          contact={data.value.waitlistEntries.find((e) => e.contact.id === hoveredWaitlistContact.value)?.contact}
          showEditButton={true}
          x={tooltipPosition.value.x}
          y={tooltipPosition.value.y}
          isWaitlist={true}
        />
      )}
      {hoveredContact.value !== null && (
        <ContactTooltip
          contact={data.value.contacts.find((c) => c.id === hoveredContact.value)}
          showEditButton={false}
          x={tooltipPosition.value.x}
          y={tooltipPosition.value.y}
          isWaitlist={false}
        />
      )}
      {hoveredNote.value !== null && (
        <NoteTooltip
          note={data.value.waitlistEntries.find((e) => e.id === hoveredNote.value)?.notes}
          x={tooltipPosition.value.x}
          y={tooltipPosition.value.y}
        />
      )}
    </section>
  );
});
