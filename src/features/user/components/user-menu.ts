import { LitElement, css } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { SignalWatcher, html } from '@lit-labs/signals';

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

import {
  isConnected,
  userAddress,
  networkName,
  userProfile,
  isConnecting,
  connectWallet,
  disconnectWallet,
} from '@state/user/user';

@customElement('profile-area')
export class ProfileArea extends SignalWatcher(LitElement) {
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
      overflow: hidden; /* Hide any overflow */
      text-overflow: ellipsis; /* Add ellipsis for overflowing text */
    }
    .status {
      font-size: 12px;
      color: var(--sl-color-neutral-500);
      margin: 0;
    }
    .balance {
      font-size: 12px;
      color: var(--sl-color-neutral-500);
      margin: 0;
    }
    .menu-item-content {
      display: flex;
      flex-direction: column;
    }
    .menu-item-content .status {
      margin-top: 4px;
    }
    .menu-item-content .balance {
      margin-top: 4px;
    }
    img {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      object-fit: cover;
    }
    sl-button::part(base) {
      color: var(--main-foreground);
      background: var(--main-background);
      border-color: var(--main-foreground);
    }
    sl-button::part(base):hover {
      color: var(--main-background);
      background: var(--main-foreground);
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
      console.log('ProfileArea: disconnectWallet completed.');
    } catch (error) {
      console.error('Error during disconnect phase of reconnect:', error);
    } finally {
      await new Promise((resolve) => setTimeout(resolve, 100));
      try {
        await connectWallet();
        console.log('ProfileArea: connectWallet called.');
      } catch (connectError) {
        console.error('Error during connect phase of reconnect:', connectError);
      }
    }
  }

  render() {
    // Access signal values using .get() in component logic
    const isConnectedValue = isConnected.get();
    const address = userAddress.get();
    const currentNetworkName = networkName.get();
    const profile = userProfile.get();
    const connectingValue = isConnecting.get();
    const displayName = profile?.name || (address ? address : 'Connecting...');

    return isConnectedValue && address
      ? html`
          <sl-dropdown distance="12" skidding="22" placement="top-end">
            <span slot="trigger" class="trigger-content" title="Profile menu">
              <user-avatar
                .address=${address || ''}
                .imageUrl=${profile?.image || profile?.avatar || ''}
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
                <div class="menu-item-content">
                  <span>Network</span>
                  <p class="status">${currentNetworkName || 'Unknown'}</p>
                </div>
              </sl-menu-item>
              <sl-menu-item
                @click=${() => modal.open({ view: 'OnRampProviders' })}
              >
                <sl-icon slot="prefix" src="${getUpdIcon}"></sl-icon>
                <span>Get UPD</span>
              </sl-menu-item>
              <sl-divider></sl-divider>
              <sl-menu-item>
                <sl-icon slot="prefix" src="${creditCardIcon}"></sl-icon>
                <div class="menu-item-content">
                  <span>Balance (Coming Soon)</span>
                </div>
              </sl-menu-item>
              <sl-divider></sl-divider>
              <sl-menu-item>
                <a href="/profile/${address}" title="My Profile">
                  My Profile
                </a>
              </sl-menu-item>
            </sl-menu>
          </sl-dropdown>
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
