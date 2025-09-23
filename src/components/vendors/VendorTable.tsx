import { component$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { useDeleteVendorAction } from '~/routes/vendors';
import { EditIcon, DeleteIcon } from '../icons';

export const VendorTable = component$(
  ({ vendors, highlightId }: { vendors: any[]; highlightId?: string }) => {
    const navigate = useNavigate();
    const deleteVendorAction = useDeleteVendorAction();

    if (vendors.length === 0) {
      return (
        <div class="table-container">
          <div class="p-8 text-center">
            <p style="color: rgb(var(--color-text-secondary))">No vendors found</p>
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
              <th>Short Name</th>
              <th>CHT Fuel Surcharge</th>
              <th>Vendor Fuel Surcharge</th>
              <th>Status</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor) => {
              const isHighlighted = highlightId && String(vendor.id) === highlightId;
              return (
                <tr
                  key={vendor.id}
                  class={isHighlighted ? 'row-highlighted' : ''}
                >
                  <td class="font-medium">{vendor.name}</td>
                  <td>{vendor.shortName}</td>
                  <td class="font-medium">
                    ${vendor.chtFuelSurcharge.toFixed(2)}
                  </td>
                  <td class="font-medium">
                    ${vendor.vendorFuelSurcharge.toFixed(2)}
                  </td>
                  <td>
                    <span
                      class={`badge ${
                        vendor.isActive
                          ? 'badge-success'
                          : 'badge-danger'
                      }`}
                    >
                      {vendor.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td class="text-center">
                    <div class="flex justify-center items-center gap-1">
                      <button
                        class="btn-icon btn-icon-primary"
                        title="Edit vendor"
                        onClick$={() => navigate(`/vendors/edit/${vendor.id}`)}
                      >
                        <EditIcon size={16} />
                      </button>
                      <button
                        class="btn-icon btn-icon-danger"
                        title="Delete vendor"
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
