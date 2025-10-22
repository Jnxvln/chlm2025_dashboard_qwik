import { component$ } from '@builder.io/qwik';

interface CheckboxProps {
  name: string;
  label: string;
  checked?: boolean;
  disabled?: boolean;
  class?: string;
}

/**
 * Checkbox input component with integrated label.
 * Unlike other form components, this includes its own label for better UX.
 *
 * @example
 * ```tsx
 * <Checkbox
 *   name="isFeatured"
 *   label="Featured Material"
 *   checked={material.isFeatured}
 * />
 * ```
 */
export default component$<CheckboxProps>(({
  name,
  label,
  checked,
  disabled,
  class: className = '',
}) => {
  return (
    <div class={`flex items-center gap-2 ${className}`}>
      <input
        type="checkbox"
        id={name}
        name={name}
        checked={checked}
        disabled={disabled}
        class="h-4 w-4 rounded"
        style="accent-color: rgb(var(--color-primary))"
      />
      <label
        for={name}
        class="text-sm font-medium"
        style="color: rgb(var(--color-text-primary))"
      >
        {label}
      </label>
    </div>
  );
});
