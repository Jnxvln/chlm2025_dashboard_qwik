import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
export { useHaulsLoader } from './loader';
import { useNavigate, routeAction$, zod$, z } from '@builder.io/qwik-city';
import { useHaulsLoader } from './loader';
import PageTitle from '~/components/PageTitle';
import { db } from '~/lib/db';

export const useDeleteHaulAction = routeAction$(
  async (data, event) => {
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

function updateUrl(nav: any, driver?: string, startDate?: string, endDate?: string) {
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
  
  nav(url.pathname + '?' + url.searchParams.toString());
}

export default component$(() => {
  const data = useHaulsLoader();
  const nav = useNavigate();
  const deleteAction = useDeleteHaulAction();
  const expandedRows = useSignal<Set<number>>(new Set());

  useVisibleTask$(({ track }) => {
    track(() => data.value);
    
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      
      if (!urlParams.has('driver') && !urlParams.has('startDate') && !urlParams.has('endDate')) {
        const savedDriver = getFromLocalStorage(STORAGE_KEYS.driver);
        const savedStartDate = getFromLocalStorage(STORAGE_KEYS.startDate);
        const savedEndDate = getFromLocalStorage(STORAGE_KEYS.endDate);
        
        if (savedDriver || savedStartDate || savedEndDate) {
          updateUrl(nav, savedDriver || undefined, savedStartDate || undefined, savedEndDate || undefined);
          return;
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

  const toggleRowExpansion = $((workdayId: number) => {
    const currentExpanded = new Set(expandedRows.value);
    if (currentExpanded.has(workdayId)) {
      currentExpanded.delete(workdayId);
    } else {
      currentExpanded.add(workdayId);
    }
    expandedRows.value = currentExpanded;
  });

  const handleDeleteHaul = $((haulId: number, customer: string) => {
    const confirmed = confirm(`Are you sure you want to delete this haul for ${customer}?\n\nThis action cannot be undone.`);
    if (confirmed) {
      deleteAction.submit({ haulId });
    }
  });

  // Handle delete success - reload the page to refresh data
  useVisibleTask$(({ track }) => {
    const result = track(() => deleteAction.value);
    if (result?.success) {
      // Reload the current page to refresh the hauls data
      window.location.reload();
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
      <div class="mb-6 bg-white p-4 rounded-lg shadow">
        <div class="flex flex-wrap gap-4 items-end">
          {/* Driver Dropdown */}
          {data.value.drivers.length > 0 && (
            <div>
              <label
                for="driver"
                class="block text-sm font-medium text-gray-700 mb-1"
              >
                Filter by Driver
              </label>

              <select
                id="driver"
                name="driver"
                class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange$={(_, el) => {
                  const driverValue = el.value || '';
                  saveToLocalStorage(STORAGE_KEYS.driver, driverValue);
                  updateUrl(nav, driverValue || undefined, data.value.currentStartDate || undefined, data.value.currentEndDate || undefined);
                }}
              >
                <option
                  value=""
                  selected={data.value.currentDriverId === undefined}
                >
                  All Drivers
                </option>

                {data.value.drivers.map((driver) => (
                  <option
                    key={driver.id}
                    value={String(driver.id)}
                    selected={data.value.currentDriverId === driver.id}
                  >
                    {driver.firstName} {driver.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Start Date */}
          <div>
            <label
              for="startDate"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={data.value.currentStartDate}
              class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange$={(_, el) => {
                const startDateValue = el.value;
                saveToLocalStorage(STORAGE_KEYS.startDate, startDateValue);
                updateUrl(nav, data.value.currentDriverId?.toString() || undefined, startDateValue || undefined, data.value.currentEndDate || undefined);
              }}
              onBlur$={(_, el) => {
                const startDateValue = el.value;
                if (startDateValue !== data.value.currentStartDate) {
                  saveToLocalStorage(STORAGE_KEYS.startDate, startDateValue);
                  updateUrl(nav, data.value.currentDriverId?.toString() || undefined, startDateValue || undefined, data.value.currentEndDate || undefined);
                }
              }}
            />
          </div>

          {/* End Date */}
          <div>
            <label
              for="endDate"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={data.value.currentEndDate}
              class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange$={(_, el) => {
                const endDateValue = el.value;
                saveToLocalStorage(STORAGE_KEYS.endDate, endDateValue);
                updateUrl(nav, data.value.currentDriverId?.toString() || undefined, data.value.currentStartDate || undefined, endDateValue || undefined);
              }}
              onBlur$={(_, el) => {
                const endDateValue = el.value;
                if (endDateValue !== data.value.currentEndDate) {
                  saveToLocalStorage(STORAGE_KEYS.endDate, endDateValue);
                  updateUrl(nav, data.value.currentDriverId?.toString() || undefined, data.value.currentStartDate || undefined, endDateValue || undefined);
                }
              }}
            />
          </div>

          {/* Haul Summary Button */}
          <div class="ml-auto">
            <a
              href={
                hasDriverSelected
                  ? (() => {
                      const url = new URLSearchParams();
                      url.set('driver', data.value.currentDriverId!.toString());
                      if (data.value.currentStartDate)
                        url.set('startDate', data.value.currentStartDate);
                      if (data.value.currentEndDate)
                        url.set('endDate', data.value.currentEndDate);
                      url.set(
                        'returnTo',
                        encodeURIComponent(
                          `/hauls?driver=${data.value.currentDriverId}&startDate=${data.value.currentStartDate || ''}&endDate=${data.value.currentEndDate || ''}`,
                        ),
                      );
                      return `/hauls/new?${url.toString()}`;
                    })()
                  : '#'
              }
              onClick$={(e) => {
                if (!hasDriverSelected) {
                  e.preventDefault();
                }
              }}
              class={`inline-block mr-2 px-4 py-2 rounded-md font-semibold ${
                hasDriverSelected
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-white cursor-not-allowed'
              }`}
            >
              New Haul
            </a>

            <a
              href="#"
              class={`inline-block px-4 py-2 rounded-md text-white font-semibold ${
                isSummaryEnabled
                  ? 'bg-gray-800 hover:bg-gray-700'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
              onClick$={(e) => {
                if (!isSummaryEnabled) {
                  e.preventDefault();
                } else {
                  // TODO: link to summary page
                  // const url = new URL('/hauls/summary', window.location.origin);
                  // url.searchParams.set(...);
                  // window.location.href = url.toString();
                }
              }}
            >
              Haul Summary
            </a>
          </div>
        </div>
      </div>

      {data.value.workdays.length === 0 ? (
        <p class="text-gray-500 italic">No workdays found for selected filters.</p>
      ) : (
        <div class="overflow-x-auto">
          <table class="min-w-full bg-white border border-gray-200 text-sm">
            <thead class="bg-gray-100 text-gray-700 font-semibold">
              <tr>
                <th class="px-3 py-2 text-left border">Date</th>
                <th class="px-3 py-2 text-left border">Driver</th>
                <th class="px-3 py-2 text-left border">CH Hours</th>
                <th class="px-3 py-2 text-left border">NC Hours</th>
                <th class="px-3 py-2 text-center border">Hauls</th>
                <th class="px-3 py-2 text-center border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.value.workdays.map((workday) => {
                const dateStr = formatDate(workday.date);
                const isExpanded = expandedRows.value.has(workday.id);
                const haulCount = workday._count.hauls;

                return (
                  <>
                    {/* Main Workday Row */}
                    <tr key={workday.id} class="hover:bg-gray-50">
                      <td class="px-3 py-2 border whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td class="px-3 py-2 border">
                        <div class="font-medium">
                          {workday.driver.firstName} {workday.driver.lastName}
                        </div>
                        {workday.driver.defaultTruck && (
                          <div class="text-xs text-gray-500">
                            Truck: {workday.driver.defaultTruck}
                          </div>
                        )}
                      </td>
                      <td class="px-3 py-2 border">
                        {workday.chHours} hrs
                      </td>
                      <td class="px-3 py-2 border">
                        {workday.ncHours} hrs
                        {workday.ncReasons && (
                          <div class="text-xs text-gray-500 mt-1">
                            {workday.ncReasons}
                          </div>
                        )}
                      </td>
                      <td class="px-3 py-2 border text-center">
                        {haulCount === 0 ? (
                          <a
                            href={`/hauls/new?driver=${data.value.currentDriverId}&date=${dateStr}&startDate=${data.value.currentStartDate}&endDate=${data.value.currentEndDate}&returnTo=${encodeURIComponent(`/hauls?driver=${data.value.currentDriverId}&startDate=${data.value.currentStartDate}&endDate=${data.value.currentEndDate}`)}`}
                            class="inline-flex items-center px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            + Create Haul
                          </a>
                        ) : (
                          <button
                            onClick$={() => toggleRowExpansion(workday.id)}
                            class="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                          >
                            {haulCount} haul{haulCount !== 1 ? 's' : ''} {isExpanded ? '▼' : '▶'}
                          </button>
                        )}
                      </td>
                      <td class="px-3 py-2 border text-center space-x-2">
                        <a
                          href={`/workdays/edit/${workday.id}?returnTo=${encodeURIComponent(`/hauls?driver=${data.value.currentDriverId}&startDate=${data.value.currentStartDate}&endDate=${data.value.currentEndDate}`)}`}
                          title="Edit Workday"
                          class="text-indigo-600 hover:text-indigo-900"
                        >
                          📅
                        </a>
                        {haulCount > 0 && (
                          <a
                            href={`/hauls/new?driver=${data.value.currentDriverId}&date=${dateStr}&startDate=${data.value.currentStartDate}&endDate=${data.value.currentEndDate}&returnTo=${encodeURIComponent(`/hauls?driver=${data.value.currentDriverId}&startDate=${data.value.currentStartDate}&endDate=${data.value.currentEndDate}`)}`}
                            title="Add Haul"
                            class="text-green-600 hover:text-green-900"
                          >
                            ➕
                          </a>
                        )}
                      </td>
                    </tr>

                    {/* Expanded Hauls Row */}
                    {isExpanded && haulCount > 0 && (
                      <tr key={`${workday.id}-expanded`}>
                        <td colspan="6" class="px-0 py-0 border-l border-r">
                          <div class="bg-gray-50 p-3">
                            <div class="overflow-x-auto">
                              <table class="w-full text-xs">
                                <thead class="bg-gray-200 text-gray-600">
                                  <tr>
                                    <th class="px-2 py-1 text-left">Customer / Invoices</th>
                                    <th class="px-2 py-1 text-left">From → To</th>
                                    <th class="px-2 py-1 text-left">Material / Tons / Rate</th>
                                    <th class="px-2 py-1 text-left">Miles / Pay / Truck</th>
                                    <th class="px-2 py-1 text-center">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {workday.hauls.map((haul) => (
                                    <tr key={haul.id} class="hover:bg-gray-100">
                                      <td class="px-2 py-1">
                                        <div class="font-medium">{haul.customer}</div>
                                        <div class="text-xs text-gray-500">
                                          {haul.chInvoice && <span>CH: {haul.chInvoice} | </span>}Load/Ref: {haul.loadRefNum || '—'}
                                        </div>
                                      </td>
                                      <td class="px-2 py-1">
                                        <div>{haul.vendorProduct.vendor.shortName}-{haul.vendorProduct.vendorLocation.name}</div>
                                        <div class="text-xs text-gray-500">
                                          → {haul.freightRoute.destination}
                                        </div>
                                      </td>
                                      <td class="px-2 py-1">
                                        <div>{haul.vendorProduct.name}</div>
                                        <div class="text-xs text-gray-500">
                                          {haul.quantity}t @ ${haul.rate}/t
                                        </div>
                                      </td>
                                      <td class="px-2 py-1">
                                        <div>{haul.miles} mi</div>
                                        <div class="text-xs text-gray-500">
                                          Pay: ${haul.payRate} | Truck {haul.truck}
                                        </div>
                                      </td>
                                      <td class="px-2 py-1 text-center space-x-1">
                                        <a href={`/hauls/edit/${haul.id}?returnTo=${encodeURIComponent(`/hauls?driver=${data.value.currentDriverId}&startDate=${data.value.currentStartDate}&endDate=${data.value.currentEndDate}`)}`} title="Edit">
                                          ✏️
                                        </a>
                                        <a
                                          href={`/hauls/new?duplicateId=${haul.id}&driver=${data.value.currentDriverId}&date=${dateStr}&startDate=${data.value.currentStartDate}&endDate=${data.value.currentEndDate}&returnTo=${encodeURIComponent(`/hauls?driver=${data.value.currentDriverId}&startDate=${data.value.currentStartDate}&endDate=${data.value.currentEndDate}`)}`}
                                          title="Duplicate"
                                        >
                                          📋
                                        </a>
                                        <button
                                          title="Delete"
                                          onClick$={() => handleDeleteHaul(haul.id, haul.customer || 'Unknown Customer')}
                                          class="text-red-600 hover:text-red-900 cursor-pointer"
                                        >
                                          🗑
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
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
