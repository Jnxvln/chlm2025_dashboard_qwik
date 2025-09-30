import { component$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { useDeactivateFreightRouteAction, useReactivateFreightRouteAction } from '~/routes/vendors/routes';
import { EditIcon, DeleteIcon } from '~/components/icons';

export const FreightRoutesTable = component$(
  ({ routes, highlightId }: { routes: any[]; highlightId?: string }) => {
    const nav = useNavigate();
    const deactivateAction = useDeactivateFreightRouteAction();
    const reactivateAction = useReactivateFreightRouteAction();

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
                  class={isNew ? 'row-highlighted' : (!route.isActive ? 'row-inactive' : '')}
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
                    <div class="flex justify-center items-center gap-1">
                      <button
                        class="btn-icon btn-icon-primary"
                        title="Edit freight route"
                        onClick$={() => nav(`/vendors/routes/${route.id}/edit`)}
                      >
                        <EditIcon size={16} />
                      </button>
                      {route.isActive ? (
                        <button
                          class="btn-icon btn-icon-danger"
                          title="Deactivate freight route"
                          onClick$={async () => {
                            const confirmed = confirm(
                              'Are you sure you want to remove this freight route? This will mark it as inactive.',
                            );
                            if (!confirmed) return;
                            await deactivateAction.submit({
                              id: String(route.id),
                            });
                            window.location.reload();
                          }}
                        >
                          <DeleteIcon size={16} />
                        </button>
                      ) : (
                        <button
                          class="btn-icon btn-icon-success"
                          title="Reactivate freight route"
                          onClick$={async () => {
                            await reactivateAction.submit({
                              id: String(route.id),
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
