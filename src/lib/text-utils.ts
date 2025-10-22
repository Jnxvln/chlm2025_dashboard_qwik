/**
 * Text Capitalization Utilities
 *
 * Ensures proper capitalization for database persistence.
 * Prevents ALL CAPS data from being stored.
 */

/**
 * Convert text to Title Case (capitalize first letter of each word)
 * Example: "HELLO WORLD" -> "Hello World"
 */
export function toTitleCase(text: string | null | undefined): string {
  if (!text) return '';

  return text
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (word.length === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Convert text to Sentence Case (capitalize first letter of sentence)
 * Example: "HELLO WORLD. THIS IS A TEST." -> "Hello world. This is a test."
 */
export function toSentenceCase(text: string | null | undefined): string {
  if (!text) return '';

  return text
    .toLowerCase()
    .replace(/(^\s*\w|[.!?]\s*\w)/g, (match) => match.toUpperCase());
}

/**
 * Normalize email to lowercase
 * Example: "USER@EXAMPLE.COM" -> "user@example.com"
 */
export function normalizeEmail(email: string | null | undefined): string {
  if (!email) return '';
  return email.toLowerCase().trim();
}

/**
 * Normalize phone number (keep as-is, just trim)
 * Example: " 555-1234 " -> "555-1234"
 */
export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  return phone.trim();
}

/**
 * Smart text normalization based on context
 * - If text appears to be a name: Title Case
 * - If text is short (< 50 chars): Title Case
 * - If text is long (>= 50 chars): Sentence Case
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text) return '';

  const trimmed = text.trim();
  if (trimmed.length === 0) return '';

  // For short text (likely names, titles, addresses), use Title Case
  // Examples: "JOHN SMITH" → "John Smith", "123 MAIN ST" → "123 Main St"
  if (trimmed.length < 50) {
    return toTitleCase(trimmed);
  }

  // For longer text (likely descriptions, notes, messages), use Sentence Case
  // This preserves natural sentence structure while fixing all-caps input
  // Example: "THIS IS A LONG DESCRIPTION. IT HAS MULTIPLE SENTENCES." →
  //          "This is a long description. It has multiple sentences."
  return toSentenceCase(trimmed);
}

/**
 * Preserve text as-is (for codes, IDs, URLs, etc.)
 * Just trims whitespace
 */
export function preserveCase(text: string | null | undefined): string {
  if (!text) return '';
  return text.trim();
}

/**
 * Check if text is all uppercase (more than 50% uppercase letters)
 */
export function isAllCaps(text: string): boolean {
  if (!text) return false;
  const letters = text.replace(/[^a-zA-Z]/g, '');
  if (letters.length === 0) return false;
  const uppercaseCount = (text.match(/[A-Z]/g) || []).length;
  return uppercaseCount / letters.length > 0.5;
}

/**
 * Apply normalization to all string fields in an object
 * Skips fields that should preserve case (emails, IDs, notes, etc.)
 *
 * This function is the main entry point for form data processing and prevents
 * users from accidentally submitting all-caps data to the database.
 */
export function normalizeFormData<T extends Record<string, any>>(
  data: T,
  options: {
    skipFields?: string[];
    emailFields?: string[];
    phoneFields?: string[];
  } = {}
): T {
  const {
    // Fields to preserve as-is (user wants specific formatting in these fields)
    skipFields = ['notes', 'description', 'customClosureMessage'],
    // Fields that should be lowercase (email addresses)
    emailFields = ['email', 'email1', 'email2'],
    // Fields that just need trimming (phone numbers)
    phoneFields = ['phone', 'phone1', 'phone2'],
  } = options;

  const normalized = { ...data };

  // Process each string field in the form data
  for (const [key, value] of Object.entries(normalized)) {
    if (typeof value !== 'string' || value.length === 0) continue;

    // Skip fields that should preserve case (notes, descriptions, etc.)
    // These are intentionally left as the user typed them
    if (skipFields.includes(key)) {
      normalized[key as keyof T] = preserveCase(value) as any;
    }
    // Normalize email fields to lowercase (email addresses are case-insensitive)
    else if (emailFields.includes(key)) {
      normalized[key as keyof T] = normalizeEmail(value) as any;
    }
    // Normalize phone fields (just trim whitespace, no case changes)
    else if (phoneFields.includes(key)) {
      normalized[key as keyof T] = normalizePhone(value) as any;
    }
    // Default: smart normalization based on field length
    // Short fields (names, addresses) → Title Case
    // Long fields (descriptions) → Sentence Case
    else {
      normalized[key as keyof T] = normalizeText(value) as any;
    }
  }

  return normalized;
}
