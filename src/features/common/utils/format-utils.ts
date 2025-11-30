import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { DirectiveResult } from 'lit/directive.js';

import { formatUnits } from 'viem';
import DOMPurify, { Config } from 'dompurify';
import { marked } from 'marked';
import TurndownService from 'turndown';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import { updraftSettings } from '@state/common';

// Re-export shared utilities that work in both browser and Node.js
import { shortNum } from '@shared/utils/format-utils';

export { ethAddressPattern, shortenAddress, shortNum, capitalize } from '@shared/utils/format-utils';

/**
 * Formats a funder reward percentage from the raw value
 * @param funderReward The raw funder reward value
 * @returns Formatted percentage string with 0 decimal places
 */
export function formatReward(funderReward: number): string {
  const pctFunderReward = (funderReward * 100) / updraftSettings.get().percentScale;
  return `${pctFunderReward.toFixed(0)}%`;
}

/**
 * Formats a token amount for display
 * @param amount The token amount as a bigint
 * @returns Formatted token amount string
 */
export function formatAmount(amount: bigint): string {
  if (!amount) return '0';
  return shortNum(formatUnits(amount, 18));
}

/**
 * Formats a date for display in a consistent way
 * @param timestamp Unix timestamp in seconds
 * @param format The format to use (fromNow, formatted, full)
 * @returns formatted date string
 */
export function formatDate(timestamp: number, format: string) {
  const date = dayjs(timestamp * 1000);
  switch (format) {
    case 'fromNow':
      return date.fromNow();
    case 'withTime':
      return date.format('MMM D, YYYY [at] h:mm A');
    case 'full':
      return `${date.format('MMM D, YYYY [at] h:mm A')} (${date.fromNow()})`;
    default:
      return date.format('MMM D, YYYY');
  }
}

/**
 * DOMPurify configuration for rich text content with GitHub Flavored Markdown support
 *
 * Security considerations:
 * - Task list checkboxes are safe because they're disabled by default
 * - Table attributes (scope, colspan, rowspan) are safe for accessibility and layout
 * - class attribute is limited to what marked.js generates (e.g., language-* for code blocks)
 * - No style attribute to prevent CSS injection
 * - No onclick or other event handlers
 * - href is restricted by ALLOWED_URI_REGEXP
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
    'hr',
    'blockquote',
    'pre',
    'code',
    // GitHub Flavored Markdown support
    'del', // Strikethrough (~~text~~)
    'input', // Task list checkboxes
    'table', // Tables
    'thead', // Table header group
    'tbody', // Table body group
    'tr', // Table rows
    'th', // Table header cells
    'td', // Table data cells
  ],
  ALLOWED_ATTR: [
    'href',
    'target', // For opening links in new tabs
    'rel', // For security attributes like noreferrer
    // Task list checkbox attributes
    'type', // For input type="checkbox"
    'checked', // For checked checkboxes
    'disabled', // Task list checkboxes are disabled by default
    // Table attributes for accessibility and styling
    'scope', // For th elements (row/col/rowgroup/colgroup)
    'colspan', // For spanning multiple columns
    'rowspan', // For spanning multiple rows
    // General attributes that are safe and useful
    'class', // For CSS styling (marked.js adds language-* classes to code blocks)
    'id', // For anchoring and accessibility
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  KEEP_CONTENT: true, // Preserve text content when removing disallowed tags
};

// Add hook to automatically make all links open in new tabs with security attributes
// This runs after DOMPurify sanitization to ensure our security policy is enforced
DOMPurify.addHook('afterSanitizeAttributes', function (node) {
  // Only process anchor tags with href attributes
  if (node.tagName === 'A' && node.hasAttribute('href')) {
    // SECURITY: Always force target="_blank" to open in new tab
    // This overrides any user-supplied target attribute for security
    node.setAttribute('target', '_blank');

    // SECURITY: Always force rel="noreferrer" for security
    // This prevents referrer header leakage and blocks window.opener access
    // This overrides any user-supplied rel attribute to prevent security bypasses
    node.setAttribute('rel', 'noreferrer');
  }
});

// We use turndown to unmangle markdown that's been mangled by contenteditable

// Don't escape existing markdown
TurndownService.prototype.escape = function (text) {
  return text;
};

const turndownService = new TurndownService();

marked.setOptions({
  gfm: true,
  breaks: true,
});

/**
 * Sanitizes HTML and markdown content using DOMPurify with rich text configuration
 * and returns a Lit directive that safely renders the HTML in templates
 *
 * @param content - The content to process (HTML, markdown, or mangled contenteditable HTML)
 * @returns Lit directive that renders sanitized HTML safely
 *
 * @example
 * ```typescript
 * // Plain text with entities (common from contenteditable)
 * const textInput = '# Header\n\n&gt; Quote &amp; text';
 * const cleaned = formattedText(textInput);
 * // Result: <h1>Header</h1><blockquote><p>Quote & text</p></blockquote>
 *
 * // Actual HTML elements
 * const htmlInput = '<h1>Header</h1><p>Text</p>';
 * const converted = formattedText(htmlInput);
 * // Result: <h1>Header</h1><p>Text</p>
 * ```
 */
export function formattedText(content: string): DirectiveResult {
  // Use placeholder approach to preserve spaces through turndown processing
  const SPACE_PLACEHOLDER = '___SPACE___';

  let spacePreservedContent = content;

  // Replace &nbsp; entities with placeholders that turndown won't strip
  spacePreservedContent = spacePreservedContent.replace(/&nbsp;/g, SPACE_PLACEHOLDER);

  // Process through turndown
  const unmangledMarkdown = turndownService.turndown(spacePreservedContent);

  // Convert placeholders back to spaces
  const markdownWithSpaces = unmangledMarkdown.replace(new RegExp(SPACE_PLACEHOLDER, 'g'), ' ');

  const htmlContent = marked(markdownWithSpaces) as string;
  const sanitized = DOMPurify.sanitize(htmlContent, RICH_TEXT_SANITIZE_CONFIG);
  return unsafeHTML(sanitized);
}
