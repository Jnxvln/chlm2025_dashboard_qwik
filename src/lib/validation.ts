/**
 * Custom validation functions for business rules
 * @module lib/validation
 */

/**
 * Validates that a freight route destination is not attempting to bypass the toYard checkbox
 * by manually entering variations of "C&H Yard".
 *
 * This prevents users from creating duplicate yard routes by manually typing variations
 * of the yard name instead of using the dedicated checkbox.
 *
 * @param destination - The destination string to validate
 * @param toYard - Whether the "To Yard" checkbox is checked
 * @returns Validation result with isValid flag and optional error message
 *
 * @example
 * ```typescript
 * const result = validateDestinationNotYard('C&H Yard', false);
 * if (!result.isValid) {
 *   return { error: result.error };
 * }
 * ```
 */
export function validateDestinationNotYard(destination: string, toYard: boolean): {
  isValid: boolean;
  error?: string;
} {
  // If toYard is true, we force the destination to be "C&H Yard" anyway, so it's valid
  if (toYard) {
    return { isValid: true };
  }

  // Normalize the destination for comparison to catch all variations:
  // 1. Convert to lowercase ("C&H YARD" → "c&h yard")
  // 2. Remove all spaces, hyphens, and ampersands ("c&h yard" → "chyard")
  // 3. Remove remaining punctuation ("c.h.yard" → "chyard")
  // This catches variations like: "C&H Yard", "CH-Yard", "C & H YARD", etc.
  const normalized = destination
    .toLowerCase()
    .replace(/[\s\-&]/g, '')      // Remove spacing/separators
    .replace(/[^\w]/g, '');        // Remove all other punctuation

  // List of forbidden patterns that indicate someone is trying to create a yard route
  // These patterns catch all common variations of "C&H Yard" that users might type
  const forbiddenPatterns = [
    'chyard',       // Catches: "C&H Yard", "CH Yard", "C & H Yard", "C-H Yard"
    'candh',        // Catches: "C and H", "C AND H"
    'candhyard',    // Catches: "C and H Yard", "C AND H YARD"
    'cyard',        // Catches: "C Yard", "C-Yard"
    'hyard',        // Catches: "H Yard", "H-Yard"
  ];

  // Check if normalized destination matches any forbidden pattern
  const matchesForbidden = forbiddenPatterns.some(pattern => normalized.includes(pattern));

  // Also check if it's JUST "yard" (common shortcut users might try)
  const isJustYard = normalized === 'yard';

  if (matchesForbidden || isJustYard) {
    return {
      isValid: false,
      error: 'To create a yard route, please use the "To Yard (C&H Yard)" checkbox instead of manually entering the destination.',
    };
  }

  return { isValid: true };
}
