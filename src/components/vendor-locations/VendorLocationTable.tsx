import { component$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { useDeleteVendorLocationAction } from '~/routes/vendors/locations';

export const VendorLocationTable = component$(
  ({
    vendorLocations,
    highlightId,
  }: {
    vendorLocations: any[];
    highlightId?: string;
  }) => {
    const navigate = useNavigate();
    const deleteVendorLocationAction = useDeleteVendorLocationAction();

    return (
      <div class="overflow-x-auto shadow border border-gray-200 rounded-lg">
        <table class="min-w-full text-sm text-left text-gray-800 bg-white">
          <thead class="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
            <tr>
              <th class="px-4 py-3">Location Name</th>
              <th class="px-4 py-3">Vendor</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendorLocations.map((location) => {
              const isNew = highlightId && String(location.id) === highlightId;
              return (
                <tr
                  key={location.id}
                  class={`border-t border-gray-200 transition-colors ${isNew ? 'bg-yellow-100/50' : 'hover:bg-gray-100'}`}
                >
                  <td class="px-4 py-3 font-medium">{location.name}</td>
                  <td class="px-4 py-3">
                    {location.vendor.name} ({location.vendor.shortName})
                  </td>
                  <td class="px-4 py-3">
                    <span
                      class={`px-2 py-1 text-xs rounded-full ${
                        location.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {location.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-center space-x-2">
                    <button
                      class="text-blue-600 hover:underline text-sm"
                      onClick$={() =>
                        navigate(`/vendors/locations/edit/${location.id}`)
                      }
                    >
                      Edit
                    </button>
                    <button
                      class="text-red-500 hover:underline text-sm"
                      onClick$={async () => {
                        const confirmed = confirm(
                          'Are you sure you want to delete this vendor location?',
                        );
                        if (!confirmed) return;
                        await deleteVendorLocationAction.submit({
                          id: String(location.id),
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
