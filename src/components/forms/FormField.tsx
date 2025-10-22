import { component$, Slot } from '@builder.io/qwik';

interface FormFieldProps {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  helpText?: string;
}

/**
 * Generic form field wrapper component that provides consistent styling
 * and structure for form inputs including label, error display, and help text.
 *
 * @example
 * ```tsx
 * <FormField label="Email" name="email" required error={errors.email}>
 *   <input type="email" name="email" class="w-full" />
 * </FormField>
 * ```
 */
export default component$<FormFieldProps>(({ label, name, required, error, helpText }) => {
  return (
    <div class="space-y-2">
      <label
        for={name}
        class="block text-sm font-medium"
        style="color: rgb(var(--color-text-secondary))"
      >
        {label}
        {required && <span class="text-red-500 ml-1">*</span>}
      </label>

      {/* Child input element passed via slot */}
      <Slot />

      {/* Help text (shown when no error) */}
      {helpText && !error && (
        <p class="text-xs" style="color: rgb(var(--color-text-secondary))">
          {helpText}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p class="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
