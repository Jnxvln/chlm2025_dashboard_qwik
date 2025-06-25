import { component$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { useDeleteVendorAction } from '~/routes/vendors';

export const VendorTable = component$(
  ({ vendors, highlightId }: { vendors: any[]; highlightId?: string }) => {
    const navigate = useNavigate();
    const deleteVendorAction = useDeleteVendorAction();

    return (
      <div class="overflow-x-auto shadow border border-gray-200 rounded-lg">
        <table class="min-w-full text-sm text-left text-gray-800 bg-white">
          <thead class="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
            <tr>
              <th class="px-4 py-3">Name</th>
              <th class="px-4 py-3">Short Name</th>
              <th class="px-4 py-3">CHT Fuel Surcharge</th>
              <th class="px-4 py-3">Vendor Fuel Surcharge</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor) => {
              const isNew = highlightId && String(vendor.id) === highlightId;
              return (
                <tr
                  key={vendor.id}
                  class={`border-t border-gray-200 transition-colors ${isNew ? 'bg-yellow-100/50' : 'hover:bg-gray-100'}`}
                >
                  <td class="px-4 py-3 font-medium">{vendor.name}</td>
                  <td class="px-4 py-3">{vendor.shortName}</td>
                  <td class="px-4 py-3">
                    ${vendor.chtFuelSurcharge.toFixed(2)}
                  </td>
                  <td class="px-4 py-3">
                    ${vendor.vendorFuelSurcharge.toFixed(2)}
                  </td>
                  <td class="px-4 py-3">
                    <span
                      class={`px-2 py-1 text-xs rounded-full ${
                        vendor.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {vendor.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-center space-x-2">
                    <button
                      class="text-blue-600 hover:underline text-sm"
                      onClick$={() => navigate(`/vendors/edit/${vendor.id}`)}
                    >
                      Edit
                    </button>
                    <button
                      class="text-red-500 hover:underline text-sm"
                      onClick$={async () => {
                        const confirmed = confirm(
                          'Are you sure you want to delete this vendor?',
                        );
                        if (!confirmed) return;
                        await deleteVendorAction.submit({
                          id: String(vendor.id),
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
