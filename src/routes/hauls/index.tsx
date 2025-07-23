import { component$, useSignal } from '@builder.io/qwik';
export { useHaulsLoader } from './loader';
import { useNavigate } from '@builder.io/qwik-city';
import { useHaulsLoader } from './loader';

export default component$(() => {
  const data = useHaulsLoader();
  const nav = useNavigate();

  const hasDriverSelected = typeof data.value.currentDriverId === 'number';

  const isSummaryEnabled =
    hasDriverSelected &&
    !!data.value.currentStartDate &&
    !!data.value.currentEndDate;

  return (
    <>
      <h1 class="text-2xl font-bold mb-4">C&H Hauls</h1>

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
                  const url = new URL(window.location.href);
                  if (el.value) {
                    url.searchParams.set('driver', el.value);
                  } else {
                    url.searchParams.delete('driver');
                  }
                  nav(url.pathname + '?' + url.searchParams.toString());
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
                const url = new URL(window.location.href);
                url.searchParams.set('startDate', el.value);
                // window.location.href = url.toString();
                nav(url.pathname + '?' + url.searchParams.toString());
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
                const url = new URL(window.location.href);
                url.searchParams.set('endDate', el.value);
                nav(url.pathname + '?' + url.searchParams.toString());
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

      {data.value.hauls.length === 0 ? (
        <p class="text-gray-500 italic">No hauls found for selected filters.</p>
      ) : (
        <div class="overflow-x-auto">
          <table class="min-w-full bg-white border border-gray-200 text-sm">
            <thead class="bg-gray-100 text-gray-700 font-semibold">
              <tr>
                <th class="px-3 py-2 text-left border">Date</th>
                <th class="px-3 py-2 text-left border">
                  Customer / CH Inv / Inv
                </th>
                <th class="px-3 py-2 text-left border">From → To</th>
                <th class="px-3 py-2 text-left border">Mat / Tons / Rate</th>
                <th class="px-3 py-2 text-left border">Miles / Pay / Truck</th>
                <th class="px-3 py-2 text-center border">Workday</th>
                <th class="px-3 py-2 text-center border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.value.hauls.map((haul) => {
                const dateStr = haul.dateHaul.split('T')[0];
                const workdayId = data.value.workdaysByDate[dateStr];
                const calendarColor = workdayId
                  ? 'text-green-600'
                  : 'text-gray-400';
                const calendarLink = `/workdays/${
                  workdayId ? `edit/${workdayId}` : 'new'
                }?driver=${data.value.currentDriverId}&date=${dateStr}&returnTo=/hauls?driver=${data.value.currentDriverId}&startDate=${data.value.currentStartDate}&endDate=${data.value.currentEndDate}`;

                return (
                  <tr key={haul.id} class="hover:bg-gray-50">
                    <td class="px-3 py-2 border whitespace-nowrap">
                      {dateStr}
                    </td>
                    <td class="px-3 py-2 border">
                      <div class="font-medium">{haul.customer}</div>
                      <div class="text-xs text-gray-500">
                        CH: {haul.chInvoice || '—'} | Inv: {haul.invoice || '—'}
                      </div>
                    </td>
                    <td class="px-3 py-2 border">
                      <div>{haul.vendorProduct.vendor.shortName}</div>
                      <div class="text-sm text-gray-500">
                        → {haul.freightRoute.vendorLocation.name}
                      </div>
                    </td>
                    <td class="px-3 py-2 border">
                      <div>{haul.vendorProduct.name}</div>
                      <div class="text-sm text-gray-500">
                        {haul.tons}t @ ${haul.rate}/t
                      </div>
                    </td>
                    <td class="px-3 py-2 border">
                      <div>{haul.miles} mi</div>
                      <div class="text-sm text-gray-500">
                        Pay: ${haul.payRate} | {haul.truck}
                      </div>
                    </td>

                    {/* 📅 Calendar Button */}
                    <td class="px-3 py-2 border text-center">
                      <a href={calendarLink} title="Edit Workday">
                        <span class={`text-xl ${calendarColor}`}>📅</span>
                      </a>
                    </td>

                    {/* Actions */}
                    <td class="px-3 py-2 border text-center space-x-2">
                      <a href={`/hauls/edit/${haul.id}`} title="Edit">
                        ✏️
                      </a>
                      <a
                        href={`/hauls/new?duplicateId=${haul.id}&driver=${data.value.currentDriverId}&startDate=${data.value.currentStartDate}&endDate=${data.value.currentEndDate}`}
                        title="Duplicate"
                      >
                        📋
                      </a>
                      <button
                        title="Delete"
                        onClick$={() => alert('TODO: delete')}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
});
