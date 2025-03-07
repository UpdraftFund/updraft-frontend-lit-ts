import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('page-heading')
export class PageHeading extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
    }

    span {
      font-size: 2.25rem;
      font-weight: 500;
      margin-left: clamp(0px, calc((100vw - 670px) * 0.5), 200px);
      white-space: nowrap;
      color: var(--main-foreground);
    }
  `;

  render() {
    return html` <span><slot></slot></span>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-heading': PageHeading;
  }
}
