import { component$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { useDeleteDriverAction } from '~/routes/drivers';
import { EditIcon, DeleteIcon } from '../icons';

export const DriverTable = component$(
  ({ drivers, highlightId }: { drivers: any[]; highlightId?: string }) => {
    const navigate = useNavigate();
    const deleteDriverAction = useDeleteDriverAction();

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
                  class={isHighlighted ? 'row-highlighted' : ''}
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
                      <button
                        class="btn-icon btn-icon-danger"
                        title="Delete driver"
                        onClick$={async () => {
                          const confirmed = confirm(
                            'Are you sure you want to delete this driver?',
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
