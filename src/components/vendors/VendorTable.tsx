import { component$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { useDeleteVendorAction, useReactivateVendorAction } from '~/routes/vendors';
import { EditIcon, DeleteIcon } from '../icons';

export const VendorTable = component$(
  ({ vendors, highlightId }: { vendors: any[]; highlightId?: string }) => {
    const navigate = useNavigate();
    const deleteVendorAction = useDeleteVendorAction();
    const reactivateVendorAction = useReactivateVendorAction();

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
                  class={isHighlighted ? 'row-highlighted' : (!vendor.isActive ? 'row-inactive' : '')}
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
                      {vendor.isActive ? (
                        <button
                          class="btn-icon btn-icon-danger"
                          title="Deactivate vendor"
                          onClick$={async () => {
                            const confirmed = confirm(
                              'Are you sure you want to remove this vendor? This will mark them as inactive.',
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
                      ) : (
                        <button
                          class="btn-icon btn-icon-success"
                          title="Reactivate vendor"
                          onClick$={async () => {
                            await reactivateVendorAction.submit({
                              id: String(vendor.id),
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
