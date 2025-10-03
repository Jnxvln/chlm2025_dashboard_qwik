/**
 * Validates that a freight route destination is not attempting to bypass the toYard checkbox
 * by manually entering variations of "C&H Yard"
 */
export function validateDestinationNotYard(destination: string, toYard: boolean): {
  isValid: boolean;
  error?: string;
} {
  // If toYard is true, we force the destination to be "C&H Yard" anyway, so it's valid
  if (toYard) {
    return { isValid: true };
  }

  // Normalize the destination for comparison:
  // 1. Convert to lowercase
  // 2. Remove all spaces, hyphens, and ampersands
  // 3. Remove punctuation
  const normalized = destination
    .toLowerCase()
    .replace(/[\s\-&]/g, '')
    .replace(/[^\w]/g, '');

  // List of forbidden patterns that indicate someone is trying to create a yard route
  const forbiddenPatterns = [
    'chyard',       // "C&H Yard", "CH Yard", "C & H Yard"
    'candh',        // "C and H"
    'candhyard',    // "C and H Yard"
    'cyard',        // "C Yard"
    'hyard',        // "H Yard"
  ];

  // Check if normalized destination matches any forbidden pattern
  const matchesForbidden = forbiddenPatterns.some(pattern => normalized.includes(pattern));

  // Also check if it's JUST "yard" (common shortcut)
  const isJustYard = normalized === 'yard';

  if (matchesForbidden || isJustYard) {
    return {
      isValid: false,
      error: 'To create a yard route, please use the "To Yard (C&H Yard)" checkbox instead of manually entering the destination.',
    };
  }

  return { isValid: true };
}
