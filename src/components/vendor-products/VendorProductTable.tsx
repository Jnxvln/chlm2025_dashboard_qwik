import { component$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { useDeleteVendorProductAction, useReactivateVendorProductAction } from '~/routes/vendors/products';
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
    const reactivateVendorProductAction = useReactivateVendorProductAction();

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
                  class={isNew ? 'row-highlighted' : (!product.isActive ? 'row-inactive' : '')}
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
                    <div class="flex justify-center items-center gap-1">
                      <button
                        class="btn-icon btn-icon-primary"
                        onClick$={() =>
                          navigate(`/vendors/products/edit/${product.id}`)
                        }
                        title="Edit product"
                      >
                        <EditIcon size={16} />
                      </button>
                      {product.isActive ? (
                        <button
                          class="btn-icon btn-icon-danger"
                          onClick$={async () => {
                            const confirmed = confirm(
                              'Are you sure you want to remove this vendor product? This will mark it as inactive.',
                            );
                            if (!confirmed) return;
                            await deleteVendorProductAction.submit({
                              id: String(product.id),
                            });
                            window.location.reload();
                          }}
                          title="Deactivate product"
                        >
                          <DeleteIcon size={16} />
                        </button>
                      ) : (
                        <button
                          class="btn-icon btn-icon-success"
                          title="Reactivate product"
                          onClick$={async () => {
                            await reactivateVendorProductAction.submit({
                              id: String(product.id),
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
