import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { when } from 'lit/directives/when.js';
import '@shoelace-style/shoelace/dist/components/avatar/avatar.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';

// Import the modal from web3.ts
import { modal } from '@/web3';

import {
  userContext,
  UserState,
  USER_CONNECTED_EVENT,
  USER_DISCONNECTED_EVENT,
  USER_PROFILE_UPDATED_EVENT,
  NETWORK_CHANGED_EVENT
} from '@/state/user-state';

/**
 * A shared component for displaying user profile information
 * Uses the centralized user state for data
 */
@customElement('user-profile')
export class UserProfile extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .profile-container {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .profile-info {
      display: flex;
      flex-direction: column;
    }

    .profile-name {
      font-weight: bold;
      font-size: 1.1rem;
      margin: 0;
    }

    .profile-address {
      font-size: 0.8rem;
      color: var(--sl-color-neutral-500);
      margin: 0;
    }

    .connect-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .error {
      color: var(--sl-color-danger-500);
      font-size: 0.8rem;
      margin: 0.25rem 0 0 0;
    }
  `;

  // Consume the user state context
  @consume({ context: userContext, subscribe: true })
  userState!: UserState;

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
    document.addEventListener(USER_CONNECTED_EVENT, this.userConnectedHandler as EventListener);
    document.addEventListener(USER_DISCONNECTED_EVENT, this.userDisconnectedHandler as EventListener);
    document.addEventListener(USER_PROFILE_UPDATED_EVENT, this.userProfileUpdatedHandler as EventListener);
    document.addEventListener(NETWORK_CHANGED_EVENT, this.networkChangedHandler as EventListener);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    
    // Remove event listeners when component is disconnected
    document.removeEventListener(USER_CONNECTED_EVENT, this.userConnectedHandler as EventListener);
    document.removeEventListener(USER_DISCONNECTED_EVENT, this.userDisconnectedHandler as EventListener);
    document.removeEventListener(USER_PROFILE_UPDATED_EVENT, this.userProfileUpdatedHandler as EventListener);
    document.removeEventListener(NETWORK_CHANGED_EVENT, this.networkChangedHandler as EventListener);
  }

  /**
   * Handle connect button click
   */
  private async handleConnect() {
    try {
      // Use the connect method from the user state
      if (this.userState) {
        await this.userState.connect();
      } else {
        // Fallback to direct modal open if userState is not available
        await modal.open({ view: 'Connect' });
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  }

  /**
   * Formats an address for display
   */
  private formatAddress(address: string): string {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  render() {
    // Check if the user state is available
    if (!this.userState) {
      // Instead of just showing "Loading...", let's provide a connect button
      return html`
        <div class="connect-container">
          <sl-button variant="primary" @click=${this.handleConnect}>
            Connect Wallet
          </sl-button>
        </div>
      `;
    }

    return html`
      ${when(
        this.userState.isConnected,
        () => html`
          <div class="profile-container">
            <sl-avatar
              image=${this.userState.profile?.avatar || ''}
              label="User avatar"
            ></sl-avatar>
            <div class="profile-info">
              <p class="profile-name">${this.userState.profile?.name || 'Anonymous'}</p>
              <p class="profile-address">
                ${this.formatAddress(this.userState.address || '')}
              </p>
            </div>
          </div>
        `,
        () => html`
          <div class="connect-container">
            <sl-button variant="primary" @click=${this.handleConnect} ?loading=${this.userState.isConnecting}>
              Connect Wallet
            </sl-button>
            ${when(
              this.userState.connectionError,
              () => html`<p class="error">${this.userState.connectionError}</p>`,
              () => ''
            )}
          </div>
        `
      )}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'user-profile': UserProfile;
  }
}
