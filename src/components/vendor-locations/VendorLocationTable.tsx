import { component$ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { useDeleteVendorLocationAction } from '~/routes/vendors/locations';
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
                  class={isNew ? 'table-row-highlighted' : ''}
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
                    <div class="flex justify-center items-center gap-2">
                      <button
                        class="btn-icon btn-icon-primary"
                        onClick$={() =>
                          navigate(`/vendors/locations/edit/${location.id}`)
                        }
                        title="Edit location"
                      >
                        <EditIcon />
                      </button>
                      <button
                        class="btn-icon btn-icon-danger"
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
                        title="Delete location"
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
