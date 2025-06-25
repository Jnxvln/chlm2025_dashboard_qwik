import { component$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { useDeleteVendorProductAction } from '~/routes/vendor-products';

export const VendorProductTable = component$(
  ({
    vendorProducts,
    highlightId,
  }: {
    vendorProducts: any[];
    highlightId?: string;
  }) => {
    const navigate = useNavigate();
    const deleteVendorProductAction = useDeleteVendorProductAction();

    return (
      <div class="overflow-x-auto shadow border border-gray-200 rounded-lg">
        <table class="min-w-full text-sm text-left text-gray-800 bg-white">
          <thead class="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
            <tr>
              <th class="px-4 py-3">Product Name</th>
              <th class="px-4 py-3">Cost</th>
              <th class="px-4 py-3">Vendor</th>
              <th class="px-4 py-3">Location</th>
              <th class="px-4 py-3">Notes</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendorProducts.map((product) => {
              const isNew = highlightId && String(product.id) === highlightId;
              return (
                <tr
                  key={product.id}
                  class={`border-t border-gray-200 transition-colors ${isNew ? 'bg-yellow-100/50' : 'hover:bg-gray-100'}`}
                >
                  <td class="px-4 py-3 font-medium">{product.name}</td>
                  <td class="px-4 py-3">${product.productCost.toFixed(2)}</td>
                  <td class="px-4 py-3">
                    {product.vendor.name} ({product.vendor.shortName})
                  </td>
                  <td class="px-4 py-3">{product.vendorLocation.name}</td>
                  <td class="px-4 py-3">
                    <span class="max-w-32 truncate block" title={product.notes}>
                      {product.notes || '—'}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span
                      class={`px-2 py-1 text-xs rounded-full ${
                        product.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-center space-x-2">
                    <button
                      class="text-blue-600 hover:underline text-sm"
                      onClick$={() =>
                        navigate(`/vendor-products/edit/${product.id}`)
                      }
                    >
                      Edit
                    </button>
                    <button
                      class="text-red-500 hover:underline text-sm"
                      onClick$={async () => {
                        const confirmed = confirm(
                          'Are you sure you want to delete this vendor product?',
                        );
                        if (!confirmed) return;
                        await deleteVendorProductAction.submit({
                          id: String(product.id),
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
