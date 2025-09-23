import { component$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { useDeleteVendorProductAction } from '~/routes/vendors/products';
import { EditIcon, DeleteIcon } from '~/components/icons';

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
      <div class="table-container overflow-x-auto">
        <table class="table-modern">
          <thead>
            <tr>
              <th class="text-left">Product Name</th>
              <th class="text-left">Cost</th>
              <th class="text-left">Vendor</th>
              <th class="text-left">Location</th>
              <th class="text-left">Notes</th>
              <th class="text-left">Status</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendorProducts.map((product) => {
              const isNew = highlightId && String(product.id) === highlightId;
              return (
                <tr
                  key={product.id}
                  class={isNew ? 'table-row-highlighted' : ''}
                >
                  <td class="whitespace-nowrap font-medium">{product.name}</td>
                  <td class="whitespace-nowrap font-medium">${product.productCost.toFixed(2)}</td>
                  <td class="whitespace-nowrap">
                    <div class="font-medium">{product.vendor.name}</div>
                    <div class="text-xs mt-1" style="color: rgb(var(--color-text-tertiary))">
                      {product.vendor.shortName}
                    </div>
                  </td>
                  <td class="whitespace-nowrap">{product.vendorLocation.name}</td>
                  <td class="max-w-32">
                    <span class="truncate block" title={product.notes}>
                      {product.notes || '—'}
                    </span>
                  </td>
                  <td class="whitespace-nowrap">
                    <span class={`badge ${product.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td class="text-center">
                    <div class="flex justify-center items-center gap-2">
                      <button
                        class="btn-icon btn-icon-primary"
                        onClick$={() =>
                          navigate(`/vendors/products/edit/${product.id}`)
                        }
                        title="Edit product"
                      >
                        <EditIcon />
                      </button>
                      <button
                        class="btn-icon btn-icon-danger"
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
                        title="Delete product"
                      >
                        <DeleteIcon />
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
