import { component$ } from '@builder.io/qwik';

interface TextAreaProps {
  name: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
  class?: string;
}

/**
 * Multi-line text area component with consistent styling.
 * Use with FormField component for complete form field structure.
 *
 * @example
 * ```tsx
 * <FormField label="Notes" name="notes">
 *   <TextArea name="notes" rows={4} placeholder="Enter notes..." />
 * </FormField>
 * ```
 */
export default component$<TextAreaProps>(({
  name,
  value,
  placeholder,
  required,
  disabled,
  rows = 3,
  maxLength,
  class: className = 'w-full',
}) => {
  return (
    <textarea
      id={name}
      name={name}
      value={value}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      rows={rows}
      maxLength={maxLength}
      class={className}
    />
  );
});
