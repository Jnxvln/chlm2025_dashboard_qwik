import { component$ } from '@builder.io/qwik';

interface EmailInputProps {
  name: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  class?: string;
}

/**
 * Email input component with built-in browser validation.
 * Automatically validates email format on form submission.
 *
 * @example
 * ```tsx
 * <FormField label="Email Address" name="email" required>
 *   <EmailInput name="email" placeholder="name@example.com" required />
 * </FormField>
 * ```
 */
export default component$<EmailInputProps>(({
  name,
  value,
  placeholder = 'name@example.com',
  required,
  disabled,
  class: className = 'w-full',
}) => {
  return (
    <input
      type="email"
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
