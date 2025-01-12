import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { modal } from '../../web3';

import '@shoelace-style/shoelace/dist/components/button/button.js';

@customElement('profile-area')
export class ProfileArea extends LitElement {
  static styles = css`
    img {
      border-radius: 50%;
    }
  `
  @state() connected = false;
  @state() address: `0x${string}` | undefined;

  constructor() {
    super();
    modal.subscribeAccount(({ isConnected, address }) => {
      this.connected = isConnected;
      this.address = address as `0x${string}`;
    });
  }

  render() {
    return html`
      <sl-button pill variant="primary" @click=${() => modal.open()} >Connect Wallet</sl-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'profile-area': ProfileArea;
  }
}