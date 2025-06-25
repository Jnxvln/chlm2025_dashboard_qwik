import { component$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { useDeleteDriverAction } from '~/routes/drivers';

export const DriverTable = component$(
  ({ drivers, highlightId }: { drivers: any[]; highlightId?: string }) => {
    const navigate = useNavigate();
    const deleteDriverAction = useDeleteDriverAction();

    return (
      <div class="overflow-x-auto shadow border border-gray-200 rounded-lg">
        <table class="min-w-full text-sm text-left text-gray-800 bg-white">
          <thead class="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
            <tr>
              <th class="px-4 py-3">Name</th>
              <th class="px-4 py-3">Truck #</th>
              <th class="px-4 py-3">End Dump</th>
              <th class="px-4 py-3">Flatbed</th>
              <th class="px-4 py-3">Non-Comm</th>
              <th class="px-4 py-3">Hired</th>
              <th class="px-4 py-3">Released</th>
              <th class="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver) => {
              const isNew = highlightId && String(driver.id) === highlightId;
              return (
                <tr
                  key={driver.id}
                  class={`border-t border-gray-200 transition-colors ${isNew ? 'bg-yellow-100/50' : 'hover:bg-gray-100'}`}
                >
                  <td class="px-4 py-3 font-medium">
                    {driver.firstName} {driver.lastName}
                  </td>
                  <td class="px-4 py-3">{driver.defaultTruck || '—'}</td>
                  <td class="px-4 py-3">${driver.endDumpPayRate.toFixed(2)}</td>
                  <td class="px-4 py-3">${driver.flatBedPayRate.toFixed(2)}</td>
                  <td class="px-4 py-3">
                    ${driver.nonCommissionRate.toFixed(2)}
                  </td>
                  <td class="px-4 py-3">
                    {driver.dateHired
                      ? new Date(driver.dateHired).toLocaleDateString()
                      : '—'}
                  </td>
                  <td class="px-4 py-3">
                    {driver.dateReleased
                      ? new Date(driver.dateReleased).toLocaleDateString()
                      : '—'}
                  </td>
                  <td class="px-4 py-3 text-center space-x-2">
                    <button
                      class="text-blue-600 hover:underline text-sm"
                      onClick$={() => navigate(`/drivers/edit/${driver.id}`)}
                    >
                      Edit
                    </button>
                    <button
                      class="text-red-500 hover:underline text-sm"
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
                      Delete
                    </button>
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
