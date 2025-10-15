import { component$, useSignal, useVisibleTask$, $, useComputed$ } from '@builder.io/qwik';
export { useHaulsLoader } from './loader';
import { useNavigate, useLocation, routeAction$, zod$, z, type DocumentHead } from '@builder.io/qwik-city';
import { useHaulsLoader } from './loader';
import PageTitle from '~/components/PageTitle';
import { AddIcon, EditIcon, DeleteIcon } from '~/components/icons';
import { db } from '~/lib/db';

export const useDeleteHaulAction = routeAction$(
  async (data) => {
    try {
      await db.haul.delete({
        where: { id: data.haulId },
      });
      
      return { success: true };
    } catch (error) {
      console.error('Haul deletion failed:', error);
      return { success: false, error: 'Failed to delete haul' };
    }
  },
  zod$({
    haulId: z.coerce.number(),
  }),
);

function formatDate(date: string | Date) {
  return new Date(date).toISOString().split('T')[0];
}

const STORAGE_KEYS = {
  driver: 'hauls-filter-driver',
  startDate: 'hauls-filter-startDate',
  endDate: 'hauls-filter-endDate',
  pageSize: 'hauls-page-size',
  sortOrder: 'hauls-sort-order',
};

function saveToLocalStorage(key: string, value: string) {
  if (typeof window !== 'undefined') {
    if (value) {
      localStorage.setItem(key, value);
    } else {
      localStorage.removeItem(key);
    }
  }
}

function getFromLocalStorage(key: string): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key);
  }
  return null;
}

function updateUrl(nav: any, driver?: string, startDate?: string, endDate?: string, page?: number, limit?: number, sort?: string) {
  const url = new URL(window.location.href);

  if (driver) {
    url.searchParams.set('driver', driver);
  } else {
    url.searchParams.delete('driver');
  }

  if (startDate) {
    url.searchParams.set('startDate', startDate);
  } else {
    url.searchParams.delete('startDate');
  }

  if (endDate) {
    url.searchParams.set('endDate', endDate);
  } else {
    url.searchParams.delete('endDate');
  }

  if (page && page > 1) {
    url.searchParams.set('page', page.toString());
  } else {
    url.searchParams.delete('page');
  }

  if (limit && limit !== 7) {
    url.searchParams.set('limit', limit.toString());
  } else {
    url.searchParams.delete('limit');
  }

  if (sort && sort !== 'desc') {
    url.searchParams.set('sort', sort);
  } else {
    url.searchParams.delete('sort');
  }

  nav(url.pathname + '?' + url.searchParams.toString());
}

export default component$(() => {
  const data = useHaulsLoader();
  const nav = useNavigate();
  const loc = useLocation();
  const deleteAction = useDeleteHaulAction();
  const expandedRows = useSignal<Set<number>>(new Set());
  const currentPage = useSignal(1);
  const pageSize = useSignal(7);
  const sortOrder = useSignal('desc');
  const showNewHaulMessage = useSignal(false);

  useVisibleTask$(({ track }) => {
    track(() => data.value);

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);

      // Initialize pagination and sorting from URL or localStorage
      const urlPage = parseInt(urlParams.get('page') || '1', 10);
      const urlLimit = parseInt(urlParams.get('limit') || '7', 10);
      const urlSort = urlParams.get('sort') || 'desc';

      if (urlPage > 0) currentPage.value = urlPage;
      if ([7, 14, 21, 28, 35].includes(urlLimit)) pageSize.value = urlLimit;
      if (['asc', 'desc'].includes(urlSort)) sortOrder.value = urlSort;

      if (!urlParams.has('driver') && !urlParams.has('startDate') && !urlParams.has('endDate')) {
        const savedDriver = getFromLocalStorage(STORAGE_KEYS.driver);
        const savedStartDate = getFromLocalStorage(STORAGE_KEYS.startDate);
        const savedEndDate = getFromLocalStorage(STORAGE_KEYS.endDate);
        const savedPageSize = getFromLocalStorage(STORAGE_KEYS.pageSize);
        const savedSortOrder = getFromLocalStorage(STORAGE_KEYS.sortOrder);

        if (savedPageSize && [7, 14, 21, 28, 35].includes(parseInt(savedPageSize))) {
          pageSize.value = parseInt(savedPageSize);
        }
        if (savedSortOrder && ['asc', 'desc'].includes(savedSortOrder)) {
          sortOrder.value = savedSortOrder;
        }

        if (savedDriver || savedStartDate || savedEndDate) {
          updateUrl(nav, savedDriver || undefined, savedStartDate || undefined, savedEndDate || undefined, currentPage.value, pageSize.value, sortOrder.value);
          return;
        }
      } else {
        // Load from localStorage if not in URL
        if (!urlParams.has('limit')) {
          const savedPageSize = getFromLocalStorage(STORAGE_KEYS.pageSize);
          if (savedPageSize && [7, 14, 21, 28, 35].includes(parseInt(savedPageSize))) {
            pageSize.value = parseInt(savedPageSize);
          }
        }
        if (!urlParams.has('sort')) {
          const savedSortOrder = getFromLocalStorage(STORAGE_KEYS.sortOrder);
          if (savedSortOrder && ['asc', 'desc'].includes(savedSortOrder)) {
            sortOrder.value = savedSortOrder;
          }
        }
      }

      if (data.value.currentDriverId) {
        saveToLocalStorage(STORAGE_KEYS.driver, data.value.currentDriverId.toString());
      }
      if (data.value.currentStartDate) {
        saveToLocalStorage(STORAGE_KEYS.startDate, data.value.currentStartDate);
      }
      if (data.value.currentEndDate) {
        saveToLocalStorage(STORAGE_KEYS.endDate, data.value.currentEndDate);
      }
    }
  });

  const sortedWorkdays = useComputed$(() => {
    const workdays = [...data.value.workdays];
    if (sortOrder.value === 'asc') {
      return workdays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else {
      return workdays.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  });

  const paginatedWorkdays = useComputed$(() => {
    const startIndex = (currentPage.value - 1) * pageSize.value;
    const endIndex = startIndex + pageSize.value;
    return sortedWorkdays.value.slice(startIndex, endIndex);
  });

  const totalPages = useComputed$(() => {
    return Math.ceil(sortedWorkdays.value.length / pageSize.value);
  });

  const toggleRowExpansion = $((workdayId: number) => {
    const currentExpanded = new Set(expandedRows.value);
    if (currentExpanded.has(workdayId)) {
      currentExpanded.delete(workdayId);
    } else {
      currentExpanded.add(workdayId);
    }
    expandedRows.value = currentExpanded;
  });

  const handlePageSizeChange = $((newSize: number) => {
    pageSize.value = newSize;
    currentPage.value = 1;
    saveToLocalStorage(STORAGE_KEYS.pageSize, newSize.toString());
    updateUrl(nav,
      data.value.currentDriverId?.toString() || undefined,
      data.value.currentStartDate || undefined,
      data.value.currentEndDate || undefined,
      1, newSize, sortOrder.value
    );
  });

  const handleSortChange = $((newSort: string) => {
    sortOrder.value = newSort;
    saveToLocalStorage(STORAGE_KEYS.sortOrder, newSort);
    updateUrl(nav,
      data.value.currentDriverId?.toString() || undefined,
      data.value.currentStartDate || undefined,
      data.value.currentEndDate || undefined,
      currentPage.value, pageSize.value, newSort
    );
  });

  const handlePageChange = $((newPage: number) => {
    currentPage.value = newPage;
    updateUrl(nav,
      data.value.currentDriverId?.toString() || undefined,
      data.value.currentStartDate || undefined,
      data.value.currentEndDate || undefined,
      newPage, pageSize.value, sortOrder.value
    );
  });

  const handleDeleteHaul = $((haulId: number, customer: string) => {
    const confirmed = confirm(`Are you sure you want to delete this haul for ${customer}?\n\nThis action cannot be undone.`);
    if (confirmed) {
      deleteAction.submit({ haulId });
    }
  });

  const handleDisabledNewHaulClick = $(() => {
    showNewHaulMessage.value = true;
    // Auto-hide the message after 4 seconds
    setTimeout(() => {
      showNewHaulMessage.value = false;
    }, 4000);
  });

  // Handle delete success - reload the page to refresh data and adjust pagination
  useVisibleTask$(({ track }) => {
    const result = track(() => deleteAction.value);
    if (result?.success) {
      // Check if we need to adjust the current page after deletion
      const newTotalPages = Math.ceil((sortedWorkdays.value.length - 1) / pageSize.value);
      if (currentPage.value > newTotalPages && newTotalPages > 0) {
        currentPage.value = newTotalPages;
        updateUrl(nav,
          data.value.currentDriverId?.toString() || undefined,
          data.value.currentStartDate || undefined,
          data.value.currentEndDate || undefined,
          newTotalPages, pageSize.value, sortOrder.value
        );
      } else {
        // Reload the current page to refresh the hauls data
        window.location.reload();
      }
    }
  });

  const hasDriverSelected = typeof data.value.currentDriverId === 'number';

  const isSummaryEnabled =
    hasDriverSelected &&
    !!data.value.currentStartDate &&
    !!data.value.currentEndDate;

  return (
    <section class="container mx-auto p-6">
      {/* <h1 class="text-2xl font-bold mb-4">C&H Hauls</h1> */}
      <PageTitle text="Hauls" />

      {/* Filters */}
      <div class="card mb-6">
        <div class="flex flex-wrap gap-4 items-end">
          {/* Driver Dropdown - Always visible */}
          <div>
            <label
              for="driver"
              class="block text-sm font-medium mb-1"
              style="color: rgb(var(--color-text-secondary))"
            >
              Filter by Driver
            </label>

            <select
              id="driver"
              name="driver"
              onChange$={(_, el) => {
                const driverValue = el.value || '';
                saveToLocalStorage(STORAGE_KEYS.driver, driverValue);
                currentPage.value = 1;
                updateUrl(nav, driverValue || undefined, data.value.currentStartDate || undefined, data.value.currentEndDate || undefined, 1, pageSize.value, sortOrder.value);
              }}
            >
              <option
                value=""
                selected={data.value.currentDriverId === undefined}
              >
                All Drivers
              </option>

              {data.value.drivers && data.value.drivers.length > 0 ? (
                data.value.drivers.map((driver) => (
                  <option
                    key={driver.id}
                    value={String(driver.id)}
                    selected={data.value.currentDriverId === driver.id}
                  >
                    {`${driver.firstName} ${driver.lastName}`}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  No active drivers available
                </option>
              )}
            </select>

            {(!data.value.drivers || data.value.drivers.length === 0) && (
              <p class="text-xs mt-1" style="color: rgb(var(--color-warning))">
                No active drivers found. <a href="/drivers/create" class="underline hover:no-underline" style="color: rgb(var(--color-primary))">Create a new driver</a> first or <a href="/drivers" class="underline hover:no-underline" style="color: rgb(var(--color-primary))">activate existing drivers</a>.
              </p>
            )}
          </div>

          {/* Start Date */}
          <div>
            <label
              for="startDate"
              class="block text-sm font-medium mb-1"
              style="color: rgb(var(--color-text-secondary))"
            >
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={data.value.currentStartDate}
              onChange$={(_, el) => {
                const startDateValue = el.value;
                saveToLocalStorage(STORAGE_KEYS.startDate, startDateValue);
                currentPage.value = 1;
                updateUrl(nav, data.value.currentDriverId?.toString() || undefined, startDateValue || undefined, data.value.currentEndDate || undefined, 1, pageSize.value, sortOrder.value);
              }}
              onBlur$={(_, el) => {
                const startDateValue = el.value;
                if (startDateValue !== data.value.currentStartDate) {
                  saveToLocalStorage(STORAGE_KEYS.startDate, startDateValue);
                  currentPage.value = 1;
                  updateUrl(nav, data.value.currentDriverId?.toString() || undefined, startDateValue || undefined, data.value.currentEndDate || undefined, 1, pageSize.value, sortOrder.value);
                }
              }}
            />
          </div>

          {/* End Date */}
          <div>
            <label
              for="endDate"
              class="block text-sm font-medium mb-1"
              style="color: rgb(var(--color-text-secondary))"
            >
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={data.value.currentEndDate}
              onChange$={(_, el) => {
                const endDateValue = el.value;
                saveToLocalStorage(STORAGE_KEYS.endDate, endDateValue);
                currentPage.value = 1;
                updateUrl(nav, data.value.currentDriverId?.toString() || undefined, data.value.currentStartDate || undefined, endDateValue || undefined, 1, pageSize.value, sortOrder.value);
              }}
              onBlur$={(_, el) => {
                const endDateValue = el.value;
                if (endDateValue !== data.value.currentEndDate) {
                  saveToLocalStorage(STORAGE_KEYS.endDate, endDateValue);
                  currentPage.value = 1;
                  updateUrl(nav, data.value.currentDriverId?.toString() || undefined, data.value.currentStartDate || undefined, endDateValue || undefined, 1, pageSize.value, sortOrder.value);
                }
              }}
            />
          </div>

          {/* Action Buttons */}
          <div class="ml-auto flex gap-2 relative">
            {hasDriverSelected && data.value.drivers && data.value.drivers.length > 0 ? (
              <a
                href={(() => {
                  const url = new URLSearchParams();
                  url.set('driver', data.value.currentDriverId!.toString());
                  url.set(
                    'returnTo',
                    encodeURIComponent(
                      `/hauls?driver=${data.value.currentDriverId}&startDate=${data.value.currentStartDate || ''}&endDate=${data.value.currentEndDate || ''}`,
                    ),
                  );
                  return `/hauls/new?${url.toString()}`;
                })()}
                class="btn btn-primary"
                title="Create new haul for selected driver"
              >
                New Haul
              </a>
            ) : (
              <>
                <button
                  type="button"
                  class="btn btn-ghost cursor-not-allowed opacity-50"
                  title={
                    !data.value.drivers || data.value.drivers.length === 0
                      ? 'Create or activate a driver first'
                      : 'Select a driver first'
                  }
                  onClick$={handleDisabledNewHaulClick}
                >
                  New Haul
                </button>

                {/* Flash message */}
                {showNewHaulMessage.value && (
                  <div class="absolute top-full mt-2 right-0 bg-yellow-50 border border-yellow-200 rounded-lg p-3 shadow-lg z-10 min-w-64">
                    <div class="flex items-start gap-2">
                      <div class="text-yellow-600 text-sm">⚠️</div>
                      <div class="text-sm">
                        <div class="font-medium text-yellow-800 mb-1">Cannot create haul</div>
                        <div class="text-yellow-700">
                          {!data.value.drivers || data.value.drivers.length === 0 ? (
                            <>
                              No active drivers available. <a href="/drivers/create" class="underline hover:no-underline font-medium">Create a new driver</a> or <a href="/drivers" class="underline hover:no-underline font-medium">activate existing drivers</a> first.
                            </>
                          ) : (
                            'Please select a driver from the dropdown above first.'
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <a
              href={
                isSummaryEnabled
                  ? (() => {
                      const url = new URLSearchParams();
                      url.set('driverId', data.value.currentDriverId!.toString());
                      url.set('startDate', data.value.currentStartDate!);
                      url.set('endDate', data.value.currentEndDate!);
                      return `/reports/hauls?${url.toString()}`;
                    })()
                  : '#'
              }
              class={isSummaryEnabled ? 'btn btn-secondary' : 'btn btn-ghost'}
              onClick$={(e) => {
                if (!isSummaryEnabled) {
                  e.preventDefault();
                  return;
                }

                // Validate date range (max 7 days)
                const startDate = new Date(data.value.currentStartDate!);
                const endDate = new Date(data.value.currentEndDate!);
                const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

                if (daysDiff > 7) {
                  e.preventDefault();
                  alert(`Date range is ${daysDiff} days, but reports are limited to 7 days maximum. Please select a shorter date range.`);
                  return;
                }
              }}
            >
              Haul Summary
            </a>
          </div>
        </div>
      </div>

      {/* Pagination and Sorting Controls */}
      {data.value.workdays.length > 0 && (
        <div class="card mb-6">
          <div class="flex flex-wrap gap-4 items-center justify-between">
            <div class="flex flex-wrap gap-4 items-center">
              {/* Results Per Page */}
              <div>
                <label
                  for="pageSize"
                  class="block text-sm font-medium mb-1"
                  style="color: rgb(var(--color-text-secondary))"
                >
                  Results
                </label>
                <select
                  id="pageSize"
                  value={pageSize.value}
                  onChange$={(_, el) => {
                    handlePageSizeChange(parseInt(el.value, 10));
                  }}
                >
                  <option value={7}>7 (1 week)</option>
                  <option value={14}>14 (2 weeks)</option>
                  <option value={21}>21 (3 weeks)</option>
                  <option value={28}>28 (4 weeks)</option>
                  <option value={35}>35 (5 weeks)</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label
                  for="sortOrder"
                  class="block text-sm font-medium mb-1"
                  style="color: rgb(var(--color-text-secondary))"
                >
                  Sort by Date
                </label>
                <select
                  id="sortOrder"
                  value={sortOrder.value}
                  onChange$={(_, el) => {
                    handleSortChange(el.value);
                  }}
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>

            {/* Pagination Info and Controls */}
            <div class="flex items-center gap-4">
              <span class="text-sm" style="color: rgb(var(--color-text-secondary))">
                Showing {Math.min((currentPage.value - 1) * pageSize.value + 1, sortedWorkdays.value.length)} - {Math.min(currentPage.value * pageSize.value, sortedWorkdays.value.length)} of {sortedWorkdays.value.length} workdays
              </span>

              {totalPages.value > 1 && (
                <div class="flex items-center gap-2">
                  <button
                    class="btn btn-sm"
                    disabled={currentPage.value === 1}
                    onClick$={() => handlePageChange(currentPage.value - 1)}
                  >
                    Previous
                  </button>

                  <span class="flex items-center gap-1">
                    {Array.from({ length: totalPages.value }, (_, i) => i + 1)
                      .filter(page => {
                        const current = currentPage.value;
                        return page === 1 || page === totalPages.value ||
                               (page >= current - 2 && page <= current + 2);
                      })
                      .map((page, index, array) => {
                        const prevPage = array[index - 1];
                        const showEllipsis = prevPage && page > prevPage + 1;
                        return (
                          <>
                            {showEllipsis && <span class="px-2">...</span>}
                            <button
                              key={page}
                              class={`btn btn-sm ${
                                page === currentPage.value ? 'btn-primary' : 'btn-ghost'
                              }`}
                              onClick$={() => handlePageChange(page)}
                            >
                              {page}
                            </button>
                          </>
                        );
                      })}
                  </span>

                  <button
                    class="btn btn-sm"
                    disabled={currentPage.value === totalPages.value}
                    onClick$={() => handlePageChange(currentPage.value + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {data.value.workdays.length === 0 ? (
        <div class="card text-center">
          <p style="color: rgb(var(--color-text-secondary))">No workdays found for selected filters.</p>
        </div>
      ) : (
        <div class="table-container overflow-x-auto">
          <table class="table-modern">
            <thead>
              <tr>
                <th>Date</th>
                <th>Driver</th>
                <th class="text-center">Status</th>
                <th>CH Hours</th>
                <th>NC Hours</th>
                <th class="text-center">Hauls</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedWorkdays.value.map((workday) => {
                const dateStr = formatDate(workday.date);
                const isExpanded = expandedRows.value.has(workday.id);
                const haulCount = workday._count.hauls;

                return (
                  <>
                    {/* Main Workday Row */}
                    <tr key={workday.id}>
                      <td class="whitespace-nowrap font-medium">
                        {dateStr}
                      </td>
                      <td>
                        <div class="font-medium">
                          {workday.driver.firstName} {workday.driver.lastName}
                        </div>
                        {workday.driver.defaultTruck && (
                          <div class="text-xs mt-1" style="color: rgb(var(--color-text-tertiary))">
                            Truck: {workday.driver.defaultTruck}
                          </div>
                        )}
                      </td>
                      <td class="text-center">
                        {workday.offDuty ? (
                          <div class="flex flex-col items-center">
                            <span title={`Off Duty: ${workday.offDutyReason || 'Off Duty'}`} style="font-size: 1.25rem;">
                              🏠
                            </span>
                            <span class="text-xs mt-1" style="color: rgb(var(--color-text-tertiary))">
                              {workday.offDutyReason}
                            </span>
                          </div>
                        ) : (
                          <span title="On Duty" style="font-size: 1.25rem;">
                            ✅
                          </span>
                        )}
                      </td>
                      <td>
                        <span class="font-medium">{workday.chHours} hrs</span>
                      </td>
                      <td>
                        <div>
                          <span class="font-medium">{workday.ncHours} hrs</span>
                          {workday.ncReasons && (
                            <div class="text-xs mt-1" style="color: rgb(var(--color-text-tertiary))">
                              {workday.ncReasons}
                            </div>
                          )}
                        </div>
                      </td>
                      <td class="text-center">
                        {haulCount === 0 ? (
                          workday.offDuty ? (
                            <button
                              type="button"
                              class="btn btn-sm btn-ghost cursor-not-allowed opacity-50"
                              title="Cannot create haul - driver is off duty"
                              disabled
                            >
                              <AddIcon size={14} />
                              Create Haul
                            </button>
                          ) : (
                            <a
                              href={`/hauls/new?driver=${data.value.currentDriverId}&date=${dateStr}&returnTo=${encodeURIComponent(`/hauls?driver=${data.value.currentDriverId}&startDate=${data.value.currentStartDate}&endDate=${data.value.currentEndDate}`)}`}
                              class="btn btn-sm btn-primary"
                            >
                              <AddIcon size={14} />
                              Create Haul
                            </a>
                          )
                        ) : (
                          <button
                            onClick$={() => toggleRowExpansion(workday.id)}
                            class="btn btn-sm btn-ghost"
                          >
                            {haulCount} haul{haulCount !== 1 ? 's' : ''} {isExpanded ? '▼' : '▶'}
                          </button>
                        )}
                      </td>
                      <td class="text-center">
                        <div class="flex justify-center items-center gap-1">
                          <a
                            href={`/workdays/edit/${workday.id}?returnTo=${encodeURIComponent(`/hauls?driver=${data.value.currentDriverId}&startDate=${data.value.currentStartDate}&endDate=${data.value.currentEndDate}`)}`}
                            title="Edit Workday"
                            class="btn-icon btn-icon-primary"
                          >
                            <EditIcon size={16} />
                          </a>
                          {haulCount > 0 && !workday.offDuty && (
                            <a
                              href={`/hauls/new?driver=${data.value.currentDriverId}&date=${dateStr}&returnTo=${encodeURIComponent(`/hauls?driver=${data.value.currentDriverId}&startDate=${data.value.currentStartDate}&endDate=${data.value.currentEndDate}`)}`}
                              title="Add Haul"
                              class="btn-icon"
                              style="color: rgb(var(--color-success))"
                            >
                              <AddIcon size={16} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Hauls Row */}
                    {isExpanded && haulCount > 0 && (
                      <tr key={`${workday.id}-expanded`}>
                        <td colSpan={7} class="p-0">
                          <div style="background-color: rgb(var(--color-bg-secondary))" class="p-4">
                            <div class="table-container">
                              <table class="table-modern text-xs">
                                <thead>
                                  <tr>
                                    <th class="text-left">Customer / Invoices</th>
                                    <th class="text-left">From → To</th>
                                    <th class="text-left">Material / Tons / Rate</th>
                                    <th class="text-left">Miles / Pay / Truck</th>
                                    <th class="text-center">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {workday.hauls.map((haul: any) => {
                                    return (
                                      <tr key={haul.id}>
                                        <td>
                                          <div class="font-medium">{haul.customer}</div>
                                          <div class="text-xs mt-1" style="color: rgb(var(--color-text-tertiary))">
                                            {haul.chInvoice && <span>CH: {haul.chInvoice} | </span>}Load/Ref: {haul.loadRefNum || '—'}
                                          </div>
                                        </td>
                                        <td>
                                          {haul.vendorProduct && haul.freightRoute ? (
                                            <>
                                              <div class="font-medium">{haul.vendorProduct.vendor.shortName}-{haul.vendorProduct.vendorLocation.name}</div>
                                              <div class="text-xs mt-1" style="color: rgb(var(--color-text-tertiary))">
                                                → {haul.freightRoute.destination}
                                              </div>
                                            </>
                                          ) : (
                                            <div class="font-medium">—</div>
                                          )}
                                        </td>
                                        <td>
                                          <div class="font-medium">{haul.vendorProduct?.name || '—'}</div>
                                          <div class="text-xs mt-1" style="color: rgb(var(--color-text-tertiary))">
                                            {haul.quantity}t @ ${haul.rate}/t
                                          </div>
                                        </td>
                                        <td>
                                          <div class="font-medium">{haul.miles || 0} mi</div>
                                          <div class="text-xs mt-1" style="color: rgb(var(--color-text-tertiary))">
                                            Pay: ${haul.payRate || 0} | Truck {haul.truck}
                                          </div>
                                        </td>
                                        <td class="text-center">
                                          <div class="flex justify-center items-center gap-1">
                                            <a href={`/hauls/edit/${haul.id}?returnTo=${encodeURIComponent(
                                              `/hauls?driver=${data.value.currentDriverId}&startDate=${data.value.currentStartDate}&endDate=${data.value.currentEndDate}`
                                            )}`} title="Edit Haul" class="btn-icon btn-icon-primary">
                                              <EditIcon size={14} />
                                            </a>
                                            <button
                                              title="Delete Haul"
                                              onClick$={() => handleDeleteHaul(haul.id, haul.customer || 'Unknown Customer')}
                                              class="btn-icon btn-icon-danger"
                                            >
                                              <DeleteIcon size={14} />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
});

export const head: DocumentHead = {
  title: 'CHLM25 | Hauls',
  meta: [
    {
      name: 'description',
      content: 'Manage and track landscape material deliveries, hauls, and driver assignments for mulch, gravel, and other materials.',
    },
  ],
};
