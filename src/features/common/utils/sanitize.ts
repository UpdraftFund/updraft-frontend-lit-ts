import DOMPurify, { Config } from 'dompurify';

/**
 * Default DOMPurify configuration for rich text content
 * Allows common formatting tags while maintaining security
 *
 * Based on common rich text formatting needs:
 * - Text formatting: strong, b, em, i, u
 * - Structure: p, br, h1-h6, blockquote
 * - Lists: ul, ol, li
 * - Links: a (with href attribute)
 *
 * KEEP_CONTENT: true preserves text content when removing disallowed tags
 * Note: Script tags and their content are completely removed for security
 */
export const RICH_TEXT_SANITIZE_CONFIG: Config = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    'a',
    'ul',
    'ol',
    'li',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
  ],
  ALLOWED_ATTR: ['href'],
  ALLOWED_URI_REGEXP:
    /^(?:(?:(?:f|ht)tps?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  KEEP_CONTENT: true, // Preserve text content when removing disallowed tags
};

/**
 * Sanitizes HTML content using DOMPurify with rich text configuration
 *
 * This function removes potentially dangerous HTML while preserving
 * common rich text formatting. It's safe to use with user-generated content.
 *
 * @param htmlContent - The HTML content to sanitize
 * @returns Sanitized HTML string safe for innerHTML
 *
 * @example
 * ```typescript
 * const userInput = '<p>Hello <script>alert("xss")</script> <strong>world</strong>!</p>';
 * const safe = sanitizeRichText(userInput);
 * // Result: '<p>Hello  <strong>world</strong>!</p>'
 * ```
 */
export function sanitizeRichText(htmlContent: string): string {
  return DOMPurify.sanitize(htmlContent, RICH_TEXT_SANITIZE_CONFIG);
}
