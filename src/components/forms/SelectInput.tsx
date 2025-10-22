import { component$, Slot, type PropFunction } from '@builder.io/qwik';

interface SelectInputProps {
  name: string;
  value?: string;
  required?: boolean;
  disabled?: boolean;
  class?: string;
  onChange$?: PropFunction<(value: string) => void>;
}

/**
 * Standard select dropdown component with consistent styling.
 * Options should be passed as children (slot).
 *
 * @example
 * ```tsx
 * <FormField label="Category" name="categoryId" required>
 *   <SelectInput name="categoryId" required>
 *     <option value="">Select a category</option>
 *     {categories.map(cat => (
 *       <option key={cat.id} value={cat.id}>{cat.name}</option>
 *     ))}
 *   </SelectInput>
 * </FormField>
 * ```
 */
export default component$<SelectInputProps>(({
  name,
  value,
  required,
  disabled,
  class: className = 'w-full',
  onChange$,
}) => {
  return (
    <select
      id={name}
      name={name}
      value={value}
      required={required}
      disabled={disabled}
      class={className}
      onChange$={(e) => onChange$ && onChange$((e.target as HTMLSelectElement).value)}
    >
      <Slot />
    </select>
  );
});
