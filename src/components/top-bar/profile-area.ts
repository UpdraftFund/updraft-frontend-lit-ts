import { LitElement, css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { SignalWatcher, html } from '@lit-labs/signals';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/dropdown/dropdown.js';
import '@shoelace-style/shoelace/dist/components/menu/menu.js';
import '@shoelace-style/shoelace/dist/components/menu-item/menu-item.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';


import '@/features/common/components/upd-dialog';
import { UpdDialog } from '@/features/common/components/upd-dialog';

import plusLgIcon from '@icons/plus-lg.svg';
import layersIcon from '@icons/layers.svg';
import creditCardIcon from '@icons/credit-card.svg';
import reconnectIcon from '@icons/arrow-clockwise.svg';
import getUpdIcon from '@icons/plus-circle.svg';

import { modal } from '@/features/common/utils/web3';
import { shortNum } from '@/features/common/utils/utils';
import {
  user,
  connectionContext,
  balanceContext,
  RequestBalanceRefresh,
} from '@/features/common/state/context';

import { userContext, UserState } from '@/features/user/state/user';

// Import the custom events
import {
  USER_CONNECTED_EVENT,
  USER_DISCONNECTED_EVENT,
  USER_PROFILE_UPDATED_EVENT,
  NETWORK_CHANGED_EVENT,
} from '@/features/user/state/user';

import { Connection, Balances } from '@/features/user/types/current-user';

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
      width: 32px;
      height: 32px;
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

  // Legacy connection context for backward compatibility
  @consume({ context: connectionContext, subscribe: true })
  connection!: Connection;
  @consume({ context: balanceContext, subscribe: true }) balances!: Balances;

  // New user state context
  @consume({ context: userContext, subscribe: true })
  userState!: UserState;

  requestBalanceRefresh() {
    this.dispatchEvent(new RequestBalanceRefresh());
  }

  private async reconnect() {
    try {
      // Use the modal to disconnect
      await modal.disconnect();
    } finally {
      // Use the new user state connect method if available
      if (this.userState?.connect) {
        await this.userState.connect();
      } else {
        // Fallback to using the modal directly
        modal.open({ view: 'Connect' });
      }
    }
  }

  private userConnectedHandler = (e: CustomEvent) => {
    // Update local state when user connects via event
    if (e.detail?.address) {
      this.requestUpdate();
    }
  };

  private userDisconnectedHandler = () => {
    // Update local state when user disconnects via event
    this.requestUpdate();
  };

  private userProfileUpdatedHandler = (e: CustomEvent) => {
    // Update local state when user profile is updated via event
    if (e.detail?.profile) {
      this.requestUpdate();
    }
  };

  private networkChangedHandler = (e: CustomEvent) => {
    // Update local state when network changes via event
    if (e.detail?.networkName) {
      this.requestUpdate();
    }
  };

  connectedCallback() {
    super.connectedCallback();

    // Add event listeners for user state changes
    document.addEventListener(
      USER_CONNECTED_EVENT,
      this.userConnectedHandler as EventListener
    );
    document.addEventListener(
      USER_DISCONNECTED_EVENT,
      this.userDisconnectedHandler as EventListener
    );
    document.addEventListener(
      USER_PROFILE_UPDATED_EVENT,
      this.userProfileUpdatedHandler as EventListener
    );
    document.addEventListener(
      NETWORK_CHANGED_EVENT,
      this.networkChangedHandler as EventListener
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // Remove event listeners when component is disconnected
    document.removeEventListener(
      USER_CONNECTED_EVENT,
      this.userConnectedHandler as EventListener
    );
    document.removeEventListener(
      USER_DISCONNECTED_EVENT,
      this.userDisconnectedHandler as EventListener
    );
    document.removeEventListener(
      USER_PROFILE_UPDATED_EVENT,
      this.userProfileUpdatedHandler as EventListener
    );
    document.removeEventListener(
      NETWORK_CHANGED_EVENT,
      this.networkChangedHandler as EventListener
    );
  }

  render() {
    // Use the new user state for rendering, but fallback to legacy connection for backward compatibility
    // Add null checks to prevent errors when userState is not yet initialized
    const isConnected =
      this.userState?.isConnected || this.connection.connected;
    const address = this.userState?.address || this.connection.address;
    const networkName =
      this.userState?.networkName || this.connection.network?.name;
    const avatar = this.userState?.profile?.avatar || user.get().avatar;
    const name = this.userState?.profile?.name || user.get().name;

    return isConnected && address
      ? html`
          ${this.hideCreateIdeaButton
            ? null
            : html`
                <a
                  href="/create-idea"
                  title="Create Idea"
                  style="display: flex; align-items: center; flex-direction: column; text-align: center;"
                >
                  <sl-icon
                    style="width: 2rem; height: 2rem;"
                    src="${plusLgIcon}"
                  ></sl-icon>
                  <span style="text-underline-position: under;"
                    >Create Idea</span
                  >
                </a>
              `}
          <sl-dropdown
            distance="12"
            skidding="22"
            placement="top-end"
            @sl-show=${this.requestBalanceRefresh}
          >
            <span slot="trigger" class="trigger-content" title="Profile menu">
              <img src="${avatar}" alt="User avatar" />
              <span class="name">${name}</span>
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
                  <p class="status">${networkName}</p>
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
                  <span>Balance</span>
                  <p class="balance">
                    ${shortNum(this.balances?.updraft?.balance || '0')} UPD
                  </p>
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
            @click=${() => {
              if (this.userState?.connect) {
                this.userState.connect();
              } else {
                // Fallback to direct modal open
                modal.open({ view: 'Connect' });
              }
            }}
            ?loading=${this.userState?.isConnecting}
            >Connect Wallet
          </sl-button>
        `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'profile-area2': ProfileArea;
  }
}
