import { component$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { useDeleteDriverAction, useReactivateDriverAction } from '~/routes/drivers';
import { EditIcon, DeleteIcon } from '../icons';

export const DriverTable = component$(
  ({ drivers, highlightId }: { drivers: any[]; highlightId?: string }) => {
    const navigate = useNavigate();
    const deleteDriverAction = useDeleteDriverAction();
    const reactivateDriverAction = useReactivateDriverAction();

    if (drivers.length === 0) {
      return (
        <div class="table-container">
          <div class="p-8 text-center">
            <p style="color: rgb(var(--color-text-secondary))">No drivers found</p>
          </div>
        </div>
      );
    }

    return (
      <div class="table-container overflow-x-auto">
        <table class="table-modern">
          <thead>
            <tr>
              <th>Name</th>
              <th>Truck #</th>
              <th>End Dump</th>
              <th>Flatbed</th>
              <th>Non-Comm</th>
              <th>Hired</th>
              <th>Released</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver) => {
              const isHighlighted = highlightId && String(driver.id) === highlightId;
              return (
                <tr
                  key={driver.id}
                  class={isHighlighted ? 'row-highlighted' : (!driver.isActive ? 'row-inactive' : '')}
                >
                  <td class="font-medium">
                    {driver.firstName} {driver.lastName}
                  </td>
                  <td>{driver.defaultTruck || '—'}</td>
                  <td class="font-medium">${driver.endDumpPayRate.toFixed(2)}</td>
                  <td class="font-medium">${driver.flatBedPayRate.toFixed(2)}</td>
                  <td class="font-medium">${driver.nonCommissionRate.toFixed(2)}</td>
                  <td>
                    {driver.dateHired
                      ? new Date(driver.dateHired).toLocaleDateString('en-US', { timeZone: 'UTC' })
                      : '—'}
                  </td>
                  <td>
                    {driver.dateReleased
                      ? new Date(driver.dateReleased).toLocaleDateString('en-US', { timeZone: 'UTC' })
                      : '—'}
                  </td>
                  <td class="text-center">
                    <div class="flex justify-center items-center gap-1">
                      <button
                        class="btn-icon btn-icon-primary"
                        title="Edit driver"
                        onClick$={() => navigate(`/drivers/edit/${driver.id}`)}
                      >
                        <EditIcon size={16} />
                      </button>
                      {driver.isActive ? (
                        <button
                          class="btn-icon btn-icon-danger"
                          title="Deactivate driver"
                          onClick$={async () => {
                            const confirmed = confirm(
                              'Are you sure you want to remove this driver? This will mark them as inactive.',
                            );
                            if (!confirmed) return;
                            await deleteDriverAction.submit({
                              id: String(driver.id),
                            });
                            window.location.reload();
                          }}
                        >
                          <DeleteIcon size={16} />
                        </button>
                      ) : (
                        <button
                          class="btn-icon btn-icon-success"
                          title="Reactivate driver"
                          onClick$={async () => {
                            await reactivateDriverAction.submit({
                              id: String(driver.id),
                            });
                            window.location.reload();
                          }}
                        >
                          <svg
                            width={16}
                            height={16}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                            <path d="M21 3v5h-5" />
                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                            <path d="M3 21v-5h5" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  },
);
