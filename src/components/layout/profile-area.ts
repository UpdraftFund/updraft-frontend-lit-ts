import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { modal } from '../../web3';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/dropdown/dropdown.js';

@customElement('profile-area')
export class ProfileArea extends LitElement {
  static styles = css`
    img {
      border-radius: 50%;
    }
    sl-icon-button {
      font-size: 2rem;
      color: var(--main-foreground);
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
    return this.connected ?
    html`
      <sl-icon-button src="/assets/icons/plus-lg.svg"></sl-icon-button>
      <sl-dropdown>
        <span slot="trigger">
          <img src="/path/to/avatar.jpg" alt="User avatar" />
          <span>${this.address}</span>
        </span>

        <sl-menu>
          <sl-menu-item value="profile">Profile</sl-menu-item>
          <sl-menu-item value="settings">Settings</sl-menu-item>
          <sl-divider></sl-divider>
          <sl-menu-item value="logout">Logout</sl-menu-item>
        </sl-menu>
       </sl-dropdown>
    `
    : html`
      <sl-button pill variant="primary" @click=${() => modal.open()} >Connect Wallet</sl-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'profile-area': ProfileArea;
  }
}