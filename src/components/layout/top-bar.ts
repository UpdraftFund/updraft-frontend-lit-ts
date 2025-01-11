import {LitElement, html, css} from 'lit';
import {customElement} from 'lit/decorators.js';

import '@shoelace-style/shoelace/dist/components/button/button.js';

@customElement('top-bar')
export class TopBar extends LitElement {
  static styles = css`
    :host {
      background: var(--subtle-background);
      display: flex;
      height: 64px;
      padding: 0px 24px;
      justify-content: space-between;
      align-items: center;
    }

    img {
      border-radius: 50%;
    }
  `
  render() {
    return html`
      <img src="/src/assets/updraft-logo-46.png" alt="Updraft logo" />
      <slot></slot>
      <sl-button pill variant="primary">Connect Wallet</sl-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'top-bar': TopBar;
  }
}