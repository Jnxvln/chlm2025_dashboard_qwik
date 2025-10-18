import { component$, useSignal, useStore, $, useTask$ } from '@builder.io/qwik';
import { DeleteIcon, AddIcon } from '../icons';

export interface URLItem {
  id: string; // Temporary ID for form management
  displayText: string;
  url: string;
  isExternal: boolean;
}

export interface URLInputListProps {
  initialUrls?: URLItem[];
}

export const URLInputList = component$<URLInputListProps>(({ initialUrls = [] }) => {
  const urls = useStore<URLItem[]>(
    initialUrls.length > 0
      ? initialUrls
      : [],
  );
  const nextId = useSignal(initialUrls.length);

  // Initialize from props
  useTask$(({ track }) => {
    track(() => initialUrls);
    if (initialUrls.length > 0 && urls.length === 0) {
      urls.splice(0, urls.length, ...initialUrls);
    }
  });

  const addUrl = $(() => {
    urls.push({
      id: `new-${nextId.value++}`,
      displayText: '',
      url: '',
      isExternal: true,
    });
  });

  const removeUrl = $((id: string) => {
    const index = urls.findIndex((u) => u.id === id);
    if (index !== -1) {
      urls.splice(index, 1);
    }
  });

  return (
    <div class="space-y-4">
      <div class="flex items-center justify-between mb-2">
        <label class="block text-sm font-medium" style="color: rgb(var(--color-text-primary))">
          Links (Optional)
        </label>
        <button
          type="button"
          class="btn btn-sm btn-ghost flex items-center gap-1"
          onClick$={addUrl}
        >
          <AddIcon size={14} />
          Add Link
        </button>
      </div>

      {urls.length === 0 ? (
        <div
          class="p-4 rounded-lg border border-dashed text-center text-sm"
          style="border-color: rgb(var(--color-border)); color: rgb(var(--color-text-secondary))"
        >
          No links added. Click "Add Link" to attach URLs to this notice.
        </div>
      ) : (
        <div class="space-y-3">
          {urls.map((urlItem, index) => (
            <div
              key={urlItem.id}
              class="p-4 rounded-lg border"
              style="background-color: rgb(var(--color-bg-secondary)); border-color: rgb(var(--color-border))"
            >
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                {/* Display Text */}
                <div>
                  <label
                    for={`url-display-${urlItem.id}`}
                    class="block text-xs font-medium mb-1"
                    style="color: rgb(var(--color-text-secondary))"
                  >
                    Display Text *
                  </label>
                  <input
                    id={`url-display-${urlItem.id}`}
                    name="urlDisplayText"
                    type="text"
                    class="w-full"
                    placeholder="e.g., View Details"
                    value={urlItem.displayText}
                    onInput$={(e) => {
                      urlItem.displayText = (e.target as HTMLInputElement).value;
                    }}
                    required
                  />
                </div>

                {/* URL */}
                <div>
                  <label
                    for={`url-address-${urlItem.id}`}
                    class="block text-xs font-medium mb-1"
                    style="color: rgb(var(--color-text-secondary))"
                  >
                    URL *
                  </label>
                  <input
                    id={`url-address-${urlItem.id}`}
                    name="urlAddress"
                    type="url"
                    class="w-full"
                    placeholder="https://example.com or /internal/path"
                    value={urlItem.url}
                    onInput$={(e) => {
                      urlItem.url = (e.target as HTMLInputElement).value;
                    }}
                    required
                  />
                </div>
              </div>

              {/* External Link Checkbox & Remove Button */}
              <div class="flex items-center justify-between">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="urlIsExternal"
                    checked={urlItem.isExternal}
                    onChange$={(e) => {
                      urlItem.isExternal = (e.target as HTMLInputElement).checked;
                    }}
                    value="true"
                  />
                  <span class="text-sm" style="color: rgb(var(--color-text-primary))">
                    External Link (opens in new tab)
                  </span>
                </label>

                <button
                  type="button"
                  class="btn-icon btn-icon-danger btn-sm"
                  title="Remove link"
                  onClick$={() => removeUrl(urlItem.id)}
                >
                  <DeleteIcon size={14} />
                </button>
              </div>

              {/* Hidden inputs to track URL data */}
              <input type="hidden" name={`urlId[${index}]`} value={urlItem.id} />
            </div>
          ))}
        </div>
      )}

      <p class="text-xs mt-2" style="color: rgb(var(--color-text-secondary))">
        Links will appear as clickable pills beneath the notice content. External links will open in a new tab.
      </p>
    </div>
  );
});
