import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

/**
 * Component for adding a vertical fade overlay to slot content
 * Use CSS custom properties to control the fade effect:
 * - --fade-height: Height of the fade overlay (default: 0rem)
 * - --fade-color: Color to fade to (default: transparent)
 */
@customElement('vertical-fade')
export class VerticalFade extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: relative; /* Needed for absolute positioning of the overlay */
      overflow: hidden;
      padding-bottom: var(--fade-height, 0rem);
      width: 100%; /* Ensure the component takes full width of its container */
    }

    .overlay {
      position: absolute; /* Position over the slot */
      bottom: 0;
      left: 0;
      width: 100%;
      height: var(--fade-height, 0rem);
      background: linear-gradient(transparent, var(--fade-color, transparent));
    }

    ::slotted(*) {
      word-break: break-word;
    }
  `;

  render() {
    return html`
      <slot></slot>
      <div class="overlay"></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'vertical-fade': VerticalFade;
  }
}
