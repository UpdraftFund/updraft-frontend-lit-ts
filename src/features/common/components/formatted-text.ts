import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import DOMPurify from 'dompurify';

/**
 * Component for safely displaying formatted text content using slots
 * Sanitizes HTML content to prevent XSS while preserving formatting
 */
@customElement('formatted-text')
export class FormattedText extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      display: block;
      word-wrap: break-word;
    }
  `;

  /**
   * Sanitizes the slotted content to prevent XSS attacks
   */
  private sanitizeSlotContent() {
    const slot = this.shadowRoot?.querySelector('slot');
    if (!slot) return;

    // Get all assigned nodes from the slot
    const assignedNodes = slot.assignedNodes();

    assignedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        // For element nodes, sanitize the HTML content
        const element = node as Element;
        const sanitizedHTML = DOMPurify.sanitize(element.outerHTML, {
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
        });

        // Replace the element with the sanitized version
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = sanitizedHTML;
        const sanitizedElement = tempDiv.firstChild;

        if (sanitizedElement && element.parentNode) {
          element.parentNode.replaceChild(sanitizedElement, element);
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        // For text nodes, check if they contain HTML and process accordingly
        const textContent = node.textContent || '';

        // If text contains HTML tags, sanitize it
        if (/<[^>]+>/.test(textContent)) {
          const sanitizedHTML = DOMPurify.sanitize(textContent, {
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
          });

          // Replace text node with sanitized HTML
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = sanitizedHTML;

          // Replace the text node with the sanitized elements
          if (node.parentNode) {
            while (tempDiv.firstChild) {
              node.parentNode.insertBefore(tempDiv.firstChild, node);
            }
            node.parentNode.removeChild(node);
          }
        }
        // Plain text nodes are left as-is (they're safe)
      }
    });
  }

  firstUpdated() {
    // Sanitize content after the component is first rendered
    this.sanitizeSlotContent();
  }

  updated() {
    // Re-sanitize content when the component updates (in case slot content changes)
    this.sanitizeSlotContent();
  }

  render() {
    return html` <slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'formatted-text': FormattedText;
  }
}
