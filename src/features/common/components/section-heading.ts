import { customElement } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';

@customElement('section-heading')
export class SectionHeading extends LitElement {
  static styles = css`
    :host {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--accent);
    }

    hr {
      height: 1px;
      background-color: var(--layout-divider); /* Line color */
      border: none;
    }
  `;

  render() {
    return html`
      <hr />
      <slot></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'section-heading': SectionHeading;
  }
}
