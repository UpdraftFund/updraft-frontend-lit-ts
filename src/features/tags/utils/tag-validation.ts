/**
 * Characters to remove from tags for normalization.
 * These characters don't add semantic meaning and can cause matching issues.
 * We keep hyphens (-) as they're used to separate words within tags.
 */
const CHARACTERS_TO_REMOVE = /[\[\]{}()<>.,'"`;]/g;

/**
 * Normalizes a string of tags by converting to lowercase and removing problematic characters
 * @param tags The tags string to normalize
 * @returns Normalized tags string
 */
export function normalizeTags(tags: string): string {
  return tags.toLowerCase().replace(CHARACTERS_TO_REMOVE, '');
}

/**
 * Splits tag string into individual tags
 * @param input The input string containing tags (can be null/undefined)
 * @returns Array of tag strings (empty array if input is null/undefined/empty)
 */
export function splitTags(input: string | null | undefined): string[] {
  if (!input || !input.trim()) {
    return [];
  }
  return input.split(/\s+/);
}

/**
 * Normalizes and validates tag input and sets appropriate validation messages
 * @param input The input element to normalize and validate
 * @param maxTags Maximum number of tags allowed (default: 5)
 * @param minTags Minimum number of tags required (default: 0)
 */
export function normalizeAndValidateTagsInput(
  input: HTMLInputElement | { value: string; setCustomValidity: (message: string) => void },
  minTags: number = 0,
  maxTags: number = 5
): void {
  const normalizedTags = normalizeTags(input.value);

  // Update the input value if it's an HTMLInputElement
  if ('value' in input && input.value !== normalizedTags) {
    input.value = normalizedTags;
  }

  const tags = splitTags(normalizedTags);

  if (tags.length > maxTags) {
    input.setCustomValidity(`Maximum ${maxTags} tags allowed`);
  } else if (tags.length < minTags && normalizedTags.length > 0) {
    input.setCustomValidity(`At least ${minTags} tag${minTags > 1 ? 's' : ''} is required`);
  } else {
    input.setCustomValidity('');
  }
}
