import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('page-heading')
export class PageHeading extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
      margin-left: auto;
      margin-right: auto;
      font-size: 2.25rem;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Responsive adjustments for smaller screens */
    @media (max-width: 1024px) {
      :host {
        font-size: 1.75rem;
      }
    }

    /* Allow wrapping on smaller screens with smaller font size */
    @media (max-width: 860px) {
      :host {
        font-size: 1.25rem;
        white-space: normal;
        line-height: 1.2;
        max-height: 60px; /* Ensure it stays within the 64px constraint */
        line-clamp: 2;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
    }
  `;

  render() {
    return html` <slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-heading': PageHeading;
  }
}
