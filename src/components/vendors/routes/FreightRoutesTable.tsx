import { component$ } from '@builder.io/qwik';
import { Link, useNavigate } from '@builder.io/qwik-city';

export const FreightRoutesTable = component$(
  ({ routes, highlightId }: { routes: any[]; highlightId?: string }) => {
    const nav = useNavigate();

    return (
      <div class="overflow-x-auto shadow border border-gray-200 rounded-lg">
        <table class="min-w-full text-sm text-left text-gray-800 bg-white">
          <thead class="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
            <tr>
              <th class="px-4 py-3">Destination</th>
              <th class="px-4 py-3">Freight Cost</th>
              <th class="px-4 py-3">Vendor</th>
              <th class="px-4 py-3">Location</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((route) => {
              const isNew = highlightId && String(route.id) === highlightId;
              return (
                <tr
                  key={route.id}
                  class={`border-t border-gray-200 transition-colors ${
                    isNew ? 'bg-yellow-100/50' : 'hover:bg-gray-100'
                  }`}
                >
                  <td class="px-4 py-3 font-medium">{route.destination}</td>
                  <td class="px-4 py-3">
                    ${route.freightCost.toFixed(2)} / ton
                  </td>
                  <td class="px-4 py-3">{route.vendorLocation.vendor.name}</td>
                  <td class="px-4 py-3">{route.vendorLocation.name}</td>
                  <td class="px-4 py-3">
                    <span
                      class={`px-2 py-1 text-xs rounded-full ${
                        route.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {route.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-center space-x-2">
                    <button
                      class="text-blue-600 hover:underline text-sm hover:cursor-pointer"
                      onClick$={() => nav(`/vendors/routes/${route.id}/edit`)}
                    >
                      Edit
                    </button>
                    <button
                      class="text-red-500 hover:underline text-sm hover:cursor-pointer"
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
