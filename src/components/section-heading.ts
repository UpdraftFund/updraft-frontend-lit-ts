import { customElement } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';

@customElement('section-heading')
export class SectionHeading extends LitElement {
  static styles = css`
    :host {
      font-size: .9rem;
    }

    hr {
      height: 1px; 
      background-color: currentColor; /* Line color */
      border: none;
    }

  `

  render() {
    return html`
      <hr>
      <slot></slot>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'section-heading': SectionHeading;
  }
}