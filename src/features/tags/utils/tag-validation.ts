/**
 * Parses tags from input string
 * @param input The input string containing tags (can be null/undefined)
 * @returns Array of cleaned tag strings (empty array if input is null/undefined/empty)
 */
export function parseTags(input: string | null | undefined): string[] {
  if (!input || !input.trim()) {
    return [];
  }
  return input.trim().split(/\s+/);
}

/**
 * Validates tag input and sets appropriate validation messages
 * @param input The input element to validate
 * @param maxTags Maximum number of tags allowed (default: 5)
 * @param minTags Minimum number of tags required (default: 0)
 */
export function validateTagsInput(
  input:
    | HTMLInputElement
    | { value: string; setCustomValidity: (message: string) => void },
  maxTags: number = 5,
  minTags: number = 0
): void {
  const tags = parseTags(input.value);

  if (tags.length > maxTags) {
    input.setCustomValidity(`Maximum ${maxTags} tags allowed`);
  } else if (tags.length < minTags && input.value.trim().length > 0) {
    input.setCustomValidity(`Minimum ${minTags} tags required`);
  } else {
    input.setCustomValidity('');
  }
}
