import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { consume } from '@lit/context';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/dropdown/dropdown.js';
import '@shoelace-style/shoelace/dist/components/menu/menu.js';
import '@shoelace-style/shoelace/dist/components/menu-item/menu-item.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';

import { modal } from '../../web3';
import { shortNum } from '../../utils';
import { User, userContext, Balances, balanceContext, RequestBalanceRefresh } from '../../context';

@customElement('profile-area')
export class ProfileArea extends LitElement {
  static styles = css`
    :host,
    .trigger-content {
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--main-foreground);
    }
    .trigger-content {
      cursor: pointer;
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
  @consume({ context: balanceContext, subscribe: true }) balances!: Balances;

  requestBalanceRefresh() {
    this.dispatchEvent(new RequestBalanceRefresh());
  }

  render() {
    return this.user.connected ?
    html`
      <sl-icon-button src="/assets/icons/plus-lg.svg"></sl-icon-button>
      <sl-dropdown distance="20" placement="top-end" @sl-show="${this.requestBalanceRefresh}")>
        <span slot="trigger" class="trigger-content">
          <img src="${this.user.avatar}" alt="User avatar" />
          <span class="name">${this.user.name || this.user.address}</span>
        </span>
        <sl-menu>
          <sl-menu-item>
            <span>
              <sl-icon src="/assets/icons/lightbulb.svg"></sl-icon>
              Choose Network
            </span>
            <p class="status">Mainnet</p>
          </sl-menu-item>
          <sl-menu-item>
            <span>
              <sl-icon src="/assets/icons/lightbulb.svg"></sl-icon>
              Buy Gas Tokens
            </span>
            ${this.balances.ETH && html`<p class="status">${shortNum(this.balances.ETH, 5)} ETH</p>`}
          </sl-menu-item>
          <sl-menu-item>Swap for UPD</sl-menu-item>
          <sl-menu-item>View Profile</sl-menu-item>
          <sl-menu-item>Activity</sl-menu-item>
          <sl-menu-item>Disconnect</sl-menu-item>
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