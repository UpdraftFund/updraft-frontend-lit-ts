import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { consume } from '@lit/context';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/dropdown/dropdown.js';
import '@shoelace-style/shoelace/dist/components/menu/menu.js';
import '@shoelace-style/shoelace/dist/components/menu-item/menu-item.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';

import plusLgIcon from '../../assets/icons/plus-lg.svg';

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
      font-weight: 500;
    }
    img {
      border-radius: 50%;
      width: 42px;
      height: 42px;
    }
    sl-icon,
    sl-icon-button {
      font-size: 2rem;
      color: var(--main-foreground);
    }
    p {
      margin: 0;
      line-height: normal;
    }
    .status {
      color: var(--hint-text);
      font-size: 0.875rem;
    }
    sl-menu-item::part(base) {
      padding: 15px 12px 15px 0;
    }
    sl-menu-item::part(base):hover {
      color: var(--main-foreground);
      background-color: var(--subtle-background);
    }
    sl-menu-item::part(base):not(:hover) {
      color: var(--main-foreground);
      background-color: var(--main-background);
    }
    sl-dropdown::part(panel),
    sl-menu {
      border-radius: 15px 0 15px 15px;
      background: var(--main-background);
    }
    sl-menu {
      border: none;
      padding-top: 12px;
      box-shadow: -1px 4px 5px 3px rgba(0, 0, 0, 7%);
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
      <sl-icon-button src="${plusLgIcon}" title="Create Idea"></sl-icon-button>
      <sl-dropdown distance="12" skidding="22" placement="top-end" @sl-show="${this.requestBalanceRefresh}">
        <span slot="trigger" class="trigger-content">
          <img src="${this.user.avatar}" alt="User avatar"/>
          <span class="name">${this.user.name || this.user.address}</span>
        </span>
        <sl-menu class="menu">
          <sl-menu-item>
            <sl-icon slot="prefix" src="${plusLgIcon}"></sl-icon>
            <div>
              <p>Choose Network</p>
              <p class="status">Mainnet</p>
            </div>
          </sl-menu-item>
          <sl-menu-item>
            <sl-icon slot="prefix" src="${plusLgIcon}"></sl-icon>
            <div>
              <p>Buy Gas Tokens</p>
              ${this.balances.ETH && html`<p class="status">${shortNum(this.balances.ETH, 5)} ETH</p>`}
            </div>
          </sl-menu-item>
          <sl-menu-item>Swap for UPD</sl-menu-item>
          <sl-menu-item>View Profile</sl-menu-item>
          <sl-menu-item>Activity</sl-menu-item>
          <sl-divider></sl-divider>
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