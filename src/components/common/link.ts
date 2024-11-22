import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('app-link')
export class AppLink extends LitElement {
  @property()
  href = '';

  @property()
  variant: 'default' | 'primary' = 'default';

  @property({ type: Boolean })
  active = false;

  @property({ type: Boolean })
  external = false;

  static styles = css`
    :host {
      display: inline-block;
    }

    a {
      font-size: 18px;
      text-decoration: none;
      color: var(--mako-1000);
    }

    a.active {
      color: var(--rever-blue-600);
      font-weight: bold;
    }
  `;

  render() {
    return html`
      <a 
        href="${this.href}"
        class="${this.variant} ${this.active ? 'active' : ''}"
        target="${this.external ? '_blank' : '_self'}"
        rel="${this.external ? 'noopener noreferrer' : ''}"
      >
        <slot></slot>
      </a>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-link': AppLink;
  }
}
