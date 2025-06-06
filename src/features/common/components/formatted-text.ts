import { LitElement, css, html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { sanitizeRichText } from '@utils/sanitize';

/**
 * Helper function to replace a node with sanitized HTML content
 * Uses a temporary div to convert HTML string to DOM nodes
 * @param node - The node to replace
 * @param sanitizedHTML - The sanitized HTML string
 */
function replaceNodeWithSanitizedHTML(node: Node, sanitizedHTML: string): void {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = sanitizedHTML;

  if (node.parentNode) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      // For element nodes, replace with the first child of the temp div
      const sanitizedElement = tempDiv.firstChild;
      if (sanitizedElement) {
        node.parentNode.replaceChild(sanitizedElement, node);
      }
    } else {
      // For text nodes, replace with all children of the temp div
      while (tempDiv.firstChild) {
        node.parentNode.insertBefore(tempDiv.firstChild, node);
      }
      node.parentNode.removeChild(node);
    }
  }
}

/**
 * Component for safely displaying formatted text content using slots
 * Sanitizes HTML content to prevent XSS while preserving formatting
 */
@customElement('formatted-text')
export class FormattedText extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      display: block;
      position: relative; /* Needed for absolute positioning of the overlay */
      overflow: hidden;
      padding-bottom: var(--fade-height, 0rem);
    }

    .overlay {
      position: absolute; /* Position over the slot */
      bottom: 0;
      left: 0;
      width: 100%;
      height: var(--fade-height, 0rem);
      background: linear-gradient(transparent, var(--fade-color, transparent));
    }
  `;

  @query('slot', true) slotContent!: HTMLSlotElement;

  private sanitize() {
    if (this.slotContent) {
      const assignedNodes = this.slotContent.assignedNodes();

      assignedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // For element nodes, sanitize the HTML content
          const element = node as Element;
          const sanitizedHTML = sanitizeRichText(element.outerHTML);
          replaceNodeWithSanitizedHTML(node, sanitizedHTML);
        } else if (node.nodeType === Node.TEXT_NODE) {
          // For text nodes, check if they contain HTML and process accordingly
          const textContent = node.textContent || '';

          // If text contains HTML tags, sanitize it
          if (/<[^>]+>/.test(textContent)) {
            const sanitizedHTML = sanitizeRichText(textContent);
            replaceNodeWithSanitizedHTML(node, sanitizedHTML);
          }
          // Plain text nodes are left as-is (they're safe)
        }
      });
    }
  }

  firstUpdated() {
    // Sanitize content after the component is first rendered
    this.sanitize();
  }

  updated() {
    // Re-sanitize content when the component updates (in case slot content changes)
    this.sanitize();
  }

  render() {
    return html`
      <slot></slot>
      <div class="overlay"></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'formatted-text': FormattedText;
  }
}
