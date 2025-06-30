// src/routes/workdays/index.tsx
import { component$, useVisibleTask$ } from '@builder.io/qwik';
import {
  routeLoader$,
  routeAction$,
  Link,
  zod$,
  z,
} from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { NavLink } from '~/components/NavLink';
import PageTitle from '~/components/PageTitle';

export const useWorkdaysLoader = routeLoader$(async ({ query }) => {
  const driverId = query.get('driver');
  const startDate = query.get('startDate');
  const endDate = query.get('endDate');

  // Default to current week if no dates provided
  const now = new Date();
  const monday = new Date(now.setDate(now.getDate() - now.getDay() + 1));
  const friday = new Date(monday);
  friday.setDate(friday.getDate() + 4);

  const defaultStart = startDate || monday.toISOString().split('T')[0];
  const defaultEnd = endDate || friday.toISOString().split('T')[0];

  const where: any = {
    date: {
      gte: defaultStart,
      lte: defaultEnd,
    },
  };

  if (driverId) {
    where.driverId = parseInt(driverId);
  }

  const [workdays, drivers] = await Promise.all([
    db.workday.findMany({
      where,
      include: {
        driver: true,
        createdBy: true,
        _count: {
          select: { hauls: true },
        },
      },
      orderBy: [{ date: 'desc' }, { driver: { firstName: 'asc' } }],
    }),
    db.driver.findMany({
      where: { isActive: true },
      orderBy: { firstName: 'asc' },
    }),
  ]);

  return {
    workdays,
    drivers,
    currentDriver: driverId,
    currentStartDate: defaultStart,
    currentEndDate: defaultEnd,
  };
});

export const useDeleteWorkdayAction = routeAction$(
  async ({ id }) => {
    try {
      await db.workday.delete({ where: { id: Number(id) } });
      return { success: true };
    } catch (error) {
      console.error('Delete failed:', error);
      return { success: false, error: 'Failed to delete workday' };
    }
  },
  zod$({
    id: z.string(),
  }),
);

export default component$(() => {
  const data = useWorkdaysLoader();
  const deleteAction = useDeleteWorkdayAction();

  // Clear highlight parameter after page load
  useVisibleTask$(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('highlight')) {
      url.searchParams.delete('highlight');
      history.replaceState(null, '', url.toString());
    }
  });

  return (
    <div class="container mx-auto p-6">
      <div class="flex justify-between items-center mb-6">
        <PageTitle text="Workdays" />
        <NavLink
          href="/workdays/new"
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          + New Workday
        </NavLink>
      </div>

      <p class="mb-6 text-gray-600">
        Track daily driver hours, notes, and haul information.
      </p>

      {/* Filters */}
      <div class="mb-6 bg-white p-4 rounded-lg shadow">
        <div class="flex flex-wrap gap-4 items-center">
          <div>
            <label
              for="driver"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              Filter by Driver
            </label>
            <select
              id="driver"
              value={data.value.currentDriver || ''}
              class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange$={(_, el) => {
                const url = new URL(window.location.href);
                if (el.value) {
                  url.searchParams.set('driver', el.value);
                } else {
                  url.searchParams.delete('driver');
                }
                window.location.href = url.toString();
              }}
            >
              <option value="">All Drivers</option>
              {data.value.drivers.map((driver) => (
                <option key={driver.id} value={driver.id.toString()}>
                  {driver.firstName} {driver.lastName}
                  {driver.defaultTruck && ` - ${driver.defaultTruck}`}
                </option>
              ))}
            </select>
          </div>

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
                window.location.href = url.toString();
              }}
            />
          </div>

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
                window.location.href = url.toString();
              }}
            />
          </div>
        </div>
      </div>

      {/* Workdays Table */}
      {data.value.workdays.length > 0 ? (
        <div class="bg-white shadow-md rounded-lg overflow-hidden">
          <table class="min-w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CH Hours
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NC Hours
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hauls
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {data.value.workdays.map((workday) => (
                <tr key={workday.id} class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(workday.date).toLocaleDateString()}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {workday.driver.firstName} {workday.driver.lastName}
                    {workday.driver.defaultTruck && (
                      <span class="text-gray-500 ml-1">
                        - {workday.driver.defaultTruck}
                      </span>
                    )}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {workday.chHours} hrs
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {workday.ncHours} hrs
                    {workday.ncReasons && (
                      <div class="text-xs text-gray-500 mt-1">
                        {workday.ncReasons}
                      </div>
                    )}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    {workday.offDuty ? (
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Off Duty
                        {workday.offDutyReason && (
                          <span class="ml-1">- {workday.offDutyReason}</span>
                        )}
                      </span>
                    ) : (
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        On Duty
                      </span>
                    )}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {workday._count.hauls} hauls
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link
                      href={`/workdays/${workday.id}/edit`}
                      class="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </Link>
                    <button
                      class="text-red-600 hover:text-red-900"
                      onClick$={async () => {
                        const confirmed = confirm(
                          'Are you sure you want to delete this workday?',
                        );
                        if (!confirmed) return;
                        await deleteAction.submit({ id: String(workday.id) });
                        window.location.reload();
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div class="text-center py-12">
          <div class="text-gray-400 mb-4">
            <svg
              class="w-24 h-24 mx-auto"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">
            No workdays found
          </h3>
          <p class="text-gray-500 mb-4">
            Get started by creating your first workday.
          </p>
          <NavLink
            href="/workdays/new"
            class="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Create Workday
          </NavLink>
        </div>
      )}
    </div>
  );
});
