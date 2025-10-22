import { component$ } from '@builder.io/qwik';

interface NumberInputProps {
  name: string;
  value?: string | number;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: string | number;
  class?: string;
}

/**
 * Number input component with optional min/max validation and step control.
 * Use with FormField component for complete form field structure.
 *
 * @example
 * ```tsx
 * <FormField label="Quantity" name="quantity" required>
 *   <NumberInput name="quantity" min={0} step={1} required />
 * </FormField>
 * ```
 */
export default component$<NumberInputProps>(({
  name,
  value,
  placeholder,
  required,
  disabled,
  min,
  max,
  step = '1',
  class: className = 'w-full',
}) => {
  return (
    <input
      type="number"
      id={name}
      name={name}
      value={value}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      min={min}
      max={max}
      step={step}
      class={className}
    />
  );
});
