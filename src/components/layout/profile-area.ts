import { LitElement, css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { SignalWatcher, html } from "@lit-labs/signals";
import { disconnect } from '@wagmi/core';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/dropdown/dropdown.js';
import '@shoelace-style/shoelace/dist/components/menu/menu.js';
import '@shoelace-style/shoelace/dist/components/menu-item/menu-item.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';
import '@components/upd-dialog';
import { UpdDialog } from '@components/upd-dialog';

import plusLgIcon from '@icons/plus-lg.svg';
import layersIcon from '@icons/layers.svg';
import creditCardIcon from '@icons/credit-card.svg';
import reconnectIcon from '@icons/arrow-clockwise.svg';
import getUpdIcon from '@icons/plus-circle.svg'

import { modal, config } from '@/web3';
import { shortNum } from '@/utils';
import { user, connectionContext, balanceContext, RequestBalanceRefresh } from '@/context';

import { Connection, Balances } from '@/types';

@customElement('profile-area')
export class ProfileArea extends SignalWatcher(LitElement) {
  @property() hideCreateIdeaButton = false;

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
      max-width: 180px;
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
    .menu-avatar {
      width: 32px;
      height: 32px;
    }
    sl-icon {
      font-size: 2rem;
      color: var(--main-foreground);
    }
    p {
      margin: 0;
      line-height: normal;
    }
    .status {
      color: var(--subtle-text);
      font-size: 0.875rem;
      display: inline-block; /* Ensures the span respects the width */
      max-width: 160px;
      white-space: nowrap; /* Prevent text from wrapping to the next line */
      overflow: hidden;
      text-overflow: ellipsis;
    }
    sl-menu-item::part(base) {
      padding: 15px 0;
      gap: 10px;
    }
    sl-menu-item::part(base):hover {
      color: var(--main-foreground);
      background-color: var(--subtle-background);
    }
    sl-menu-item::part(base):not(:hover) {
      color: var(--main-foreground);
      background-color: var(--main-background);
    }
    a {
      text-decoration: none;
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
  @query('upd-dialog', true) updDialog!: UpdDialog;

  @consume({ context: connectionContext, subscribe: true }) connection!: Connection;
  @consume({ context: balanceContext, subscribe: true }) balances!: Balances;

  requestBalanceRefresh() {
    this.dispatchEvent(new RequestBalanceRefresh());
  }

  private async reconnect() {
    try {
      await disconnect(config);
    } finally {
      modal.open({ view: 'Connect' });
    }
  }

  render() {
    return this.connection.connected && this.connection.address ?
      html`
        ${this.hideCreateIdeaButton ? null : html`
          <a href="/create-idea" title="Create Idea">
            <sl-icon src="${plusLgIcon}"></sl-icon>
          </a>
        `}
        <sl-dropdown distance="12" skidding="22" placement="top-end" @sl-show=${this.requestBalanceRefresh}>
          <span slot="trigger" class="trigger-content" title="Profile menu">
            <img src="${user.get().avatar}" alt="User avatar"/>
            <span class="name">${user.get().name}</span>
          </span>
          <sl-menu class="menu">
            <sl-menu-item @click=${this.reconnect}>
              <sl-icon slot="prefix" src="${reconnectIcon}"></sl-icon>
              <span>Reconnect</span>
            </sl-menu-item>
            <sl-menu-item @click=${() => modal.open({ view: 'Networks' })}>
              <sl-icon slot="prefix" src="${layersIcon}"></sl-icon>
              <div>
                <p>Choose Network</p>
                <p class="status">${this.connection.network?.name}</p>
              </div>
            </sl-menu-item>
            <sl-menu-item @click=${() => modal.open({ view: 'OnRampProviders' })}>
              <sl-icon slot="prefix" src="${creditCardIcon}"></sl-icon>
              <div>
                <p>Buy Gas Tokens</p>
                ${this.balances.gas && html`
                  <p class="status">${shortNum(this.balances.gas.balance, 5)} ${this.balances.gas.symbol}</p>
                `}
              </div>
            </sl-menu-item>
            <sl-menu-item @click=${() => this.updDialog.show()}>
              <sl-icon slot="prefix" src="${getUpdIcon}"></sl-icon>
              <div>
                <p>Get More UPD</p>
                ${this.balances.updraft && html`
                  <p class="status">${shortNum(this.balances.updraft.balance, 5)} ${this.balances.updraft.symbol}</p>
                `}
              </div>
            </sl-menu-item>
            <a href="/profile/${this.connection.address}" title="My Profile">
              <sl-menu-item>
                <img slot="prefix" class="menu-avatar" src="${user.get().avatar}" alt="User avatar"/>
                <div>
                  <p>My Profile</p>
                  <p class="status">${user.get().name}</p>
                </div>
              </sl-menu-item>
            </a>
          </sl-menu>
        </sl-dropdown>
        <upd-dialog></upd-dialog>
      `
      : html`
          <sl-button variant="primary" @click=${() => modal.open()}>Connect Wallet</sl-button>
      `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'profile-area': ProfileArea;
  }
}