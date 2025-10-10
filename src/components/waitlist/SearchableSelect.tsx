import { component$, useSignal } from '@builder.io/qwik';

interface SearchableSelectProps {
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  options: Array<{ value: string | number; label: string }>;
  value: string;
  disabled?: boolean;
}

export const SearchableSelect = component$<SearchableSelectProps>(
  ({ name, label, required, placeholder, options, value, disabled }) => {
    const searchQuery = useSignal('');
    const isOpen = useSignal(false);
    const selectedLabel = useSignal('');
    const highlightedIndex = useSignal(-1);
    const internalValue = useSignal(value);

    // Set initial selected label
    if (value && !selectedLabel.value) {
      const selected = options.find((opt) => String(opt.value) === String(value));
      if (selected) {
        selectedLabel.value = selected.label;
      }
    }

    // Update internal value when prop changes
    if (value !== internalValue.value) {
      internalValue.value = value;
    }

    // Filter options based on search query
    const filteredOptions = searchQuery.value
      ? options.filter((opt) =>
          opt.label.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
      : options;

    return (
      <div class="relative">
        <label
          class="block text-sm font-medium mb-2"
          style="color: rgb(var(--color-text-secondary))"
        >
          {label} {required && '*'}
        </label>

        {/* Hidden input for form submission */}
        <input type="hidden" name={name} value={internalValue.value} />

        {/* Search input */}
        <div class="relative">
          <input
            type="text"
            class="w-full"
            placeholder={placeholder || `Search ${label.toLowerCase()}...`}
            value={searchQuery.value || selectedLabel.value}
            disabled={disabled}
            onInput$={(e) => {
              searchQuery.value = (e.target as HTMLInputElement).value;
              isOpen.value = true;
              highlightedIndex.value = -1;
            }}
            onFocus$={(e) => {
              isOpen.value = true;
              highlightedIndex.value = -1;
              // Clear the display so user can type
              if (selectedLabel.value && !searchQuery.value) {
                (e.target as HTMLInputElement).select();
              }
            }}
            onKeyDown$={(e) => {
              if (!isOpen.value) return;

              if (e.key === 'ArrowDown') {
                e.preventDefault();
                highlightedIndex.value = Math.min(highlightedIndex.value + 1, filteredOptions.length - 1);
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0);
              } else if (e.key === 'Enter' || e.key === 'Tab') {
                if (highlightedIndex.value >= 0 && highlightedIndex.value < filteredOptions.length) {
                  e.preventDefault();
                  const selected = filteredOptions[highlightedIndex.value];
                  internalValue.value = String(selected.value);
                  selectedLabel.value = selected.label;
                  searchQuery.value = '';
                  isOpen.value = false;
                }
              } else if (e.key === 'Escape') {
                isOpen.value = false;
                searchQuery.value = '';
                highlightedIndex.value = -1;
              }
            }}
            onBlur$={() => {
              // Delay to allow clicking on options
              setTimeout(() => {
                isOpen.value = false;
                searchQuery.value = '';
                highlightedIndex.value = -1;
              }, 300);
            }}
          />
          {selectedLabel.value && !disabled && (
            <button
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-sm"
              style="color: rgb(var(--color-text-tertiary))"
              onClick$={() => {
                internalValue.value = '';
                selectedLabel.value = '';
                searchQuery.value = '';
                isOpen.value = false;
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Dropdown list */}
        {isOpen.value && filteredOptions.length > 0 && (
          <div
            class="absolute z-50 w-full mt-1 rounded-lg shadow-xl border overflow-hidden"
            style="background-color: rgb(var(--color-bg-primary)); border-color: rgb(var(--color-border)); max-height: 300px; overflow-y: auto;"
          >
            {filteredOptions.map((option, index) => {
              const isSelected = String(option.value) === String(internalValue.value);
              const isHighlighted = index === highlightedIndex.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  class="w-full text-left px-4 py-2 transition-colors"
                  style={
                    isSelected
                      ? 'background-color: rgb(var(--color-primary) / 0.2); color: rgb(var(--color-text-primary)); font-weight: 500;'
                      : isHighlighted
                      ? 'background-color: rgb(var(--color-text-primary) / 0.06); color: rgb(var(--color-text-primary));'
                      : 'color: rgb(var(--color-text-primary)); background-color: transparent;'
                  }
                  onClick$={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    internalValue.value = String(option.value);
                    selectedLabel.value = option.label;
                    searchQuery.value = '';
                    isOpen.value = false;
                  }}
                  onMouseDown$={(e) => {
                    e.preventDefault(); // Prevent blur
                  }}
                  onMouseEnter$={() => {
                    highlightedIndex.value = index;
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        )}

        {/* No results message */}
        {isOpen.value && searchQuery.value && filteredOptions.length === 0 && (
          <div
            class="absolute z-50 w-full mt-1 rounded-lg shadow-xl border p-4 text-center"
            style="background-color: rgb(var(--color-bg-primary)); border-color: rgb(var(--color-border));"
          >
            <p class="text-sm" style="color: rgb(var(--color-text-secondary))">
              No results found
            </p>
          </div>
        )}
      </div>
    );
  }
);
