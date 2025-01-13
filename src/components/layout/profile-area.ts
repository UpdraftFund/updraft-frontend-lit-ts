import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { consume } from '@lit/context';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/dropdown/dropdown.js';

import { modal } from '../../web3';
import { User, userContext } from '../../user-context';

@customElement('profile-area')
export class ProfileArea extends LitElement {
  static styles = css`
    :host,
    .trigger-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .name {
      display: inline-block; /* Ensures the span respects the width */
      max-width: 200px;
      white-space: nowrap; /* Prevent text from wrapping to the next line */
      overflow: hidden;
      text-overflow: ellipsis;
    }
    img {
      border-radius: 50%;
      width: 42px;
      height: 42px;
    }
    sl-icon-button {
      font-size: 2rem;
      color: var(--main-foreground);
    }
  `
  @consume({ context: userContext, subscribe: true }) user!: User;

  render() {
    return this.user.connected ?
    html`
      <sl-icon-button src="/assets/icons/plus-lg.svg"></sl-icon-button>
      <sl-dropdown>
        <span slot="trigger" class="trigger-content">
          <img src="${this.user.avatar}" alt="User avatar" />
          <span class="name">${this.user.name || this.user.address}</span>
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