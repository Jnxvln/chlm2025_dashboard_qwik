import { component$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { useDeleteVendorLocationAction, useReactivateVendorLocationAction } from '~/routes/vendors/locations';
import { EditIcon, DeleteIcon } from '~/components/icons';

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
    const reactivateVendorLocationAction = useReactivateVendorLocationAction();

    return (
      <div class="table-container overflow-x-auto">
        <table class="table-modern">
          <thead>
            <tr>
              <th class="text-left">Location Name</th>
              <th class="text-left">Vendor</th>
              <th class="text-left">Status</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendorLocations.map((location) => {
              const isNew = highlightId && String(location.id) === highlightId;
              return (
                <tr
                  key={location.id}
                  class={isNew ? 'row-highlighted' : (!location.isActive ? 'row-inactive' : '')}
                >
                  <td class="whitespace-nowrap font-medium">{location.name}</td>
                  <td class="whitespace-nowrap">
                    <div class="font-medium">{location.vendor.name}</div>
                    <div class="text-xs mt-1" style="color: rgb(var(--color-text-tertiary))">
                      {location.vendor.shortName}
                    </div>
                  </td>
                  <td class="whitespace-nowrap">
                    <span class={`badge ${location.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {location.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td class="text-center">
                    <div class="flex justify-center items-center gap-1">
                      <button
                        class="btn-icon btn-icon-primary"
                        onClick$={() =>
                          navigate(`/vendors/locations/edit/${location.id}`)
                        }
                        title="Edit location"
                      >
                        <EditIcon size={16} />
                      </button>
                      {location.isActive ? (
                        <button
                          class="btn-icon btn-icon-danger"
                          onClick$={async () => {
                            const confirmed = confirm(
                              'Are you sure you want to remove this vendor location? This will mark it as inactive.',
                            );
                            if (!confirmed) return;
                            await deleteVendorLocationAction.submit({
                              id: String(location.id),
                            });
                            window.location.reload();
                          }}
                          title="Deactivate location"
                        >
                          <DeleteIcon size={16} />
                        </button>
                      ) : (
                        <button
                          class="btn-icon btn-icon-success"
                          title="Reactivate location"
                          onClick$={async () => {
                            await reactivateVendorLocationAction.submit({
                              id: String(location.id),
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
