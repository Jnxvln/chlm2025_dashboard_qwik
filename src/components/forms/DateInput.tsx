import { component$, type PropFunction } from '@builder.io/qwik';

interface DateInputProps {
  name: string;
  value?: string;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  class?: string;
  onChange$?: PropFunction<(value: string) => void>;
}

/**
 * Date input component with optional min/max date constraints.
 * Expects dates in YYYY-MM-DD format.
 *
 * @example
 * ```tsx
 * <FormField label="Delivery Date" name="deliveryDate" required>
 *   <DateInput
 *     name="deliveryDate"
 *     min={new Date().toISOString().split('T')[0]}
 *     required
 *   />
 * </FormField>
 * ```
 */
export default component$<DateInputProps>(({
  name,
  value,
  required,
  disabled,
  min,
  max,
  class: className = 'w-full',
  onChange$,
}) => {
  return (
    <input
      type="date"
      id={name}
      name={name}
      value={value}
      required={required}
      disabled={disabled}
      min={min}
      max={max}
      class={className}
      onChange$={(e) => onChange$ && onChange$((e.target as HTMLInputElement).value)}
    />
  );
});
