import { component$ } from '@builder.io/qwik';

interface TextInputProps {
  name: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
  class?: string;
}

/**
 * Standard text input component with consistent styling.
 * Use with FormField component for complete form field structure.
 *
 * @example
 * ```tsx
 * <FormField label="First Name" name="firstName" required>
 *   <TextInput name="firstName" placeholder="Enter first name" required />
 * </FormField>
 * ```
 */
export default component$<TextInputProps>(({
  name,
  value,
  placeholder,
  required,
  disabled,
  maxLength,
  class: className = 'w-full',
}) => {
  return (
    <input
      type="text"
      id={name}
      name={name}
      value={value}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      maxLength={maxLength}
      class={className}
    />
  );
});
