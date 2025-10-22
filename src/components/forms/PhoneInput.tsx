import { component$ } from '@builder.io/qwik';

interface PhoneInputProps {
  name: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  class?: string;
}

/**
 * Phone number input component with tel input type for mobile optimization.
 * No automatic formatting applied - format is handled by normalizeFormData.
 *
 * @example
 * ```tsx
 * <FormField label="Phone Number" name="phone">
 *   <PhoneInput name="phone" placeholder="(555) 123-4567" />
 * </FormField>
 * ```
 */
export default component$<PhoneInputProps>(({
  name,
  value,
  placeholder = '(555) 123-4567',
  required,
  disabled,
  class: className = 'w-full',
}) => {
  return (
    <input
      type="tel"
      id={name}
      name={name}
      value={value}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      class={className}
    />
  );
});
