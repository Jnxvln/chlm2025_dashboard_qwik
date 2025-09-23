// src/routes/workdays/index.tsx
import { component$, useVisibleTask$ } from '@builder.io/qwik';
import {
  useNavigate,
  routeLoader$,
  routeAction$,
  Link,
  zod$,
  z,
  useLocation,
} from '@builder.io/qwik-city';
import { db } from '~/lib/db';
import { NavLink } from '~/components/NavLink';
import PageTitle from '~/components/PageTitle';

function toValidDate(dateStr: string | null, fallback: Date): Date {
  if (!dateStr) return fallback;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? fallback : d;
}

export const useWorkdaysLoader = routeLoader$(async ({ query }) => {
  const driverId = query.get('driver');
  const startDate = query.get('startDate');
  const endDate = query.get('endDate');
  const now = new Date(); // Default to current week if no dates provided
  const monday = new Date(now.setDate(now.getDate() - now.getDay() + 1));
  const friday = new Date(monday);
  friday.setDate(friday.getDate() + 4);

  // const defaultStart = startDate || monday.toISOString().split('T')[0];
  // const defaultEnd = endDate || friday.toISOString().split('T')[0];
  const gte = toValidDate(startDate, monday);
  const lte = toValidDate(endDate, friday);

  const where: any = {
    date: {
      gte: new Date(gte.toISOString().split('T')[0] + 'T00:00:00Z'),
      lte: new Date(lte.toISOString().split('T')[0] + 'T23:59:59Z'),
    },
  };

  if (driverId) {
    where.driverId = parseInt(driverId);
  }

  const defaultStart = gte.toISOString().split('T')[0]; // 'YYYY-MM-DD'
  const defaultEnd = lte.toISOString().split('T')[0];

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
  const nav = useNavigate();
  const data = useWorkdaysLoader();
  const deleteAction = useDeleteWorkdayAction();
  const loc = useLocation();

  const backUrl = `/workdays${loc.url.search}`; // preserves ?driver=...&startDate=...&endDate=...

  // Clear highlight parameter after page load
  // eslint-disable-next-line qwik/no-use-visible-task
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
          class="btn btn-primary"
        >
          + New Workday
        </NavLink>
      </div>

      <div class="flex gap-4">
        <NavLink
          href="/drivers"
          class="btn btn-ghost"
        >
          ← Drivers
        </NavLink>
      </div>

      <p class="my-6" style="color: rgb(var(--color-text-secondary))">
        Track daily driver hours, notes, and haul information.
      </p>

      {/* Filters */}
      <div class="card mb-6">
        <div class="flex flex-wrap gap-4 items-center">
          <div>
            <label
              for="driver"
              class="block text-sm font-medium mb-1"
              style="color: rgb(var(--color-text-secondary))"
            >
              Filter by Driver
            </label>
            {typeof data.value.currentDriver !== 'undefined' && (
              <select
                id="driver"
                value={data.value.currentDriver?.toString() || ''}
                class="w-full"
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
                <option value="">All Drivers</option>
                {data.value.drivers.map((driver) => (
                  <option key={driver.id} value={driver.id.toString()}>
                    {`${driver.firstName} ${driver.lastName}${driver.defaultTruck ? ` - ${driver.defaultTruck}` : ''}`}
                  </option>
                ))}
              </select>
            )}
          </div>

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
              class="w-full"
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
              class="block text-sm font-medium mb-1"
              style="color: rgb(var(--color-text-secondary))"
            >
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={data.value.currentEndDate}
              class="w-full"
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
        <div class="table-container overflow-x-auto">
          <table class="table-modern">
            <thead>
              <tr>
                <th class="text-left">
                  Date
                </th>
                <th class="text-left">
                  Driver
                </th>
                <th class="text-left">
                  CH Hours
                </th>
                <th class="text-left">
                  NC Hours
                </th>
                <th class="text-left">
                  Status
                </th>
                <th class="text-left">
                  Hauls
                </th>
                <th class="text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {data.value.workdays.map((workday) => (
                <tr key={workday.id}>
                  <td class="whitespace-nowrap font-medium">
                    {new Date(workday.date).toLocaleDateString()}
                  </td>
                  <td class="whitespace-nowrap">
                    <div class="font-medium">
                      {workday.driver.firstName} {workday.driver.lastName}
                    </div>
                    {workday.driver.defaultTruck && (
                      <div class="text-xs mt-1" style="color: rgb(var(--color-text-tertiary))">
                        Truck: {workday.driver.defaultTruck}
                      </div>
                    )}
                  </td>
                  <td class="whitespace-nowrap">
                    <span class="font-medium">{workday.chHours} hrs</span>
                  </td>
                  <td class="whitespace-nowrap">
                    <div>
                      <span class="font-medium">{workday.ncHours} hrs</span>
                      {workday.ncReasons && (
                        <div class="text-xs mt-1" style="color: rgb(var(--color-text-tertiary))">
                          {workday.ncReasons}
                        </div>
                      )}
                    </div>
                  </td>
                  <td class="whitespace-nowrap">
                    {workday.offDuty ? (
                      <div>
                        <span class="badge badge-danger">
                          Off Duty
                        </span>
                        {workday.offDutyReason && (
                          <div class="text-xs mt-1" style="color: rgb(var(--color-text-tertiary))">
                            {workday.offDutyReason}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span class="badge badge-success">
                        On Duty
                      </span>
                    )}
                  </td>
                  <td class="whitespace-nowrap">
                    <span class="badge badge-secondary">
                      {workday._count.hauls} hauls
                    </span>
                  </td>
                  <td class="text-center">
                    <div class="flex justify-center items-center gap-2">
                      <Link
                        href={`/workdays/edit/${workday.id}${loc.url.search}`}
                        class="btn btn-sm btn-primary"
                      >
                        Edit
                      </Link>
                      <button
                        class="btn btn-sm btn-danger"
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div class="card text-center py-12">
          <div class="mb-4" style="color: rgb(var(--color-muted))">
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
          <h3 class="text-lg font-medium mb-2" style="color: rgb(var(--color-text-primary))">
            No workdays found
          </h3>
          <p class="mb-4" style="color: rgb(var(--color-text-secondary))">
            Get started by creating your first workday.
          </p>
          <NavLink
            href="/workdays/new"
            class="btn btn-primary"
          >
            Create Workday
          </NavLink>
        </div>
      )}
    </div>
  );
});
