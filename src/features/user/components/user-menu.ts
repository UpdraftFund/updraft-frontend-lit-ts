import { LitElement, css } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { SignalWatcher, html } from '@lit-labs/signals';
import { consume } from '@lit/context';
import { balanceContext } from '@state/common';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/dropdown/dropdown.js';
import '@shoelace-style/shoelace/dist/components/menu/menu.js';
import '@shoelace-style/shoelace/dist/components/menu-item/menu-item.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';

import '@components/common/upd-dialog';
import '@components/user/user-avatar';
import { UpdDialog } from '@components/common/upd-dialog';

import layersIcon from '@icons/navigation/layers.svg';
import creditCardIcon from '@icons/navigation/credit-card.svg';
import reconnectIcon from '@icons/navigation/arrow-clockwise.svg';
import getUpdIcon from '@icons/navigation/plus-circle.svg';

import { modal } from '@utils/web3';
import { shortNum } from '@utils/short-num';

import {
  userAddress,
  networkName,
  userProfile,
  isConnecting,
  connectWallet,
  disconnectWallet,
} from '@state/user';

@customElement('profile-area')
export class ProfileArea extends SignalWatcher(LitElement) {
  @consume({ context: balanceContext, subscribe: true }) balances!: {
    [key: string]: { symbol: string; balance: string };
  };

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
      display: inline-block;
      max-width: 180px;
      white-space: nowrap;
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
      color: var(--sl-color-neutral-500);
      font-size: 0.875rem;
      display: inline-block;
      max-width: 160px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    sl-menu-item::part(base) {
      padding: 15px 0;
      gap: 10px;
    }
    sl-menu-item::part(base):hover {
      color: var(--main-foreground);
      background-color: var(--sl-color-neutral-100);
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
  `;

  @query('upd-dialog', true) updDialog!: UpdDialog;

  private async reconnect() {
    try {
      await disconnectWallet();
    } finally {
      modal.open({ view: 'Connect' });
    }
  }

  render() {
    const address = userAddress.get();
    const currentNetworkName = networkName.get();
    const profile = userProfile.get();
    const connectingValue = isConnecting.get();
    const displayName = profile?.name || (address ? address : 'Connecting...');
    const avatarUrl = profile?.image || profile?.avatar || '';
    const ethBalanceRaw = this.balances?.eth?.balance || '0';
    const ethSymbol = this.balances?.eth?.symbol || 'ETH';
    const updBalanceRaw = this.balances?.updraft?.balance || '0';
    const updSymbol = this.balances?.updraft?.symbol || 'UPD';
    const ethBalance = isNaN(Number(ethBalanceRaw))
      ? '0.00000'
      : parseFloat(ethBalanceRaw).toFixed(5);
    const updBalance = shortNum(updBalanceRaw, 5);

    return address
      ? html`
          <sl-dropdown
            distance="12"
            skidding="22"
            placement="top-end"
            @sl-show=${() =>
              this.dispatchEvent(
                new CustomEvent('request-balance-refresh', {
                  bubbles: true,
                  composed: true,
                })
              )}
          >
            <span slot="trigger" class="trigger-content" title="Profile menu">
              <user-avatar
                .address=${address}
                .imageUrl=${avatarUrl}
                size="42px"
              ></user-avatar>
              <span class="name">${displayName}</span>
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
                  <p class="status">${currentNetworkName || 'Unknown'}</p>
                </div>
              </sl-menu-item>
              <sl-menu-item>
                <sl-icon slot="prefix" src="${creditCardIcon}"></sl-icon>
                <div>
                  <p>ETH Balance</p>
                  <p class="status">${ethBalance} ${ethSymbol}</p>
                </div>
              </sl-menu-item>
              <sl-menu-item @click=${() => this.updDialog.show()}>
                <sl-icon slot="prefix" src="${getUpdIcon}"></sl-icon>
                <div>
                  <p>UPD Balance</p>
                  <p class="status">${updBalance} ${updSymbol}</p>
                </div>
              </sl-menu-item>
              <a href="/profile/${address}" title="My Profile">
                <sl-menu-item>
                  <user-avatar
                    slot="prefix"
                    class="menu-avatar"
                    .address=${address}
                    .imageUrl=${avatarUrl}
                    size="32px"
                  ></user-avatar>
                  <div>
                    <p>My Profile</p>
                    <p class="status">${displayName}</p>
                  </div>
                </sl-menu-item>
              </a>
            </sl-menu>
          </sl-dropdown>
          <upd-dialog></upd-dialog>
        `
      : html`
          <sl-button
            variant="primary"
            @click=${() => connectWallet()}
            ?loading=${connectingValue}
            >Connect Wallet
          </sl-button>
        `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'profile-area': ProfileArea;
  }
}
