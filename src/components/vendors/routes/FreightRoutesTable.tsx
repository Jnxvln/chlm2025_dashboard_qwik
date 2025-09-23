import { component$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';

export const FreightRoutesTable = component$(
  ({ routes, highlightId }: { routes: any[]; highlightId?: string }) => {
    const nav = useNavigate();

    return (
      <div class="table-container">
        <table class="table-modern">
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Location</th>
              <th>Destination</th>
              <th>Freight Cost</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((route) => {
              const isNew = highlightId && String(route.id) === highlightId;
              return (
                <tr
                  key={route.id}
                  class={isNew ? 'row-highlighted' : ''}
                >
                  <td>{route.vendorLocation.vendor.name}</td>
                  <td>{route.vendorLocation.name}</td>
                  <td class="font-medium">{route.destination}</td>
                  <td>
                    ${route.freightCost.toFixed(2)} / ton
                  </td>
                  <td>
                    <span
                      class={route.isActive ? 'badge badge-success' : 'badge badge-danger'}
                    >
                      {route.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div class="flex gap-2">
                      <button
                        class="btn-icon btn-icon-primary"
                        onClick$={() => nav(`/vendors/routes/${route.id}/edit`)}
                      >
                        Edit
                      </button>
                      <button
                        class="btn-icon btn-icon-danger"
                        onClick$={() => {
                          const confirmed = confirm(
                            'Are you sure you want to delete this freight route?',
                          );
                          if (!confirmed) return;
                          alert('Delete logic not wired in yet');
                        }}
                      >
                        Delete
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
