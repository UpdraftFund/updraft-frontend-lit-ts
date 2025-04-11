import { customElement, property } from 'lit/decorators.js';
import { css, LitElement } from 'lit';
import { SignalWatcher, html } from '@lit-labs/signals';
import { consume } from '@lit/context';
import { Task } from '@lit/task';

import { fromHex } from 'viem';
import makeBlockie from 'ethereum-blockies-base64';

import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@/features/common/components/page-heading';
import '@/features/user/components/activity-feed';

import { connectionContext } from '@/features/common/state/context';
import { 
  userContext, 
  UserState, 
  userAddress, 
  isConnected,
  USER_CONNECTED_EVENT
} from '@/features/user/state/user';
import {
  followUser,
  isFollowed,
  unfollowUser,
} from '@/features/user/components/follow';
import { markComplete } from '@pages/home/state/beginner-tasks';
import { Connection } from '@/features/user/types/current-user';

import urqlClient from '@/features/common/utils/urql-client';
import { ProfileDocument } from '@gql';

@customElement('view-profile')
export class ViewProfile extends SignalWatcher(LitElement) {
  static styles = css`
    .container {
      display: flex;
      flex: auto;
      overflow: hidden;
    }

    activity-feed {
      flex: 0 0 789px;
    }

    main {
      flex: 1;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem 2rem;
      color: var(--main-foreground);
      max-width: 554px;
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .avatar {
      border-radius: 50%;
      width: 64px;
      height: 64px;
      aspect-ratio: 1/1;
    }

    .avatar img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
    }

    .name {
      margin: 0;
      font-size: 1.3rem;
      font-weight: 500;
    }

    .address {
      max-width: 158px;
      white-space: nowrap; /* Prevent text from wrapping to the next line */
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: 300;
      color: var(--subtle-text);
      font-size: 0.8rem;
    }

    .team {
      font-size: 0.9rem;
    }

    sl-button {
      max-width: 158px;
    }

    .section h2 {
      font-size: 1.2rem;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    .section p {
      margin-bottom: 0;
    }

    .links {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .link {
      display: flex;
      align-items: center;
      gap: 1rem;
      text-decoration: none;
      color: var(--main-foreground);
      width: fit-content;
    }

    .link:hover {
      text-decoration: underline;
      color: var(--sl-color-primary-600);
    }

    @media (max-width: 1090px) {
      activity-feed {
        flex: 0 0 0;
        pointer-events: none;
      }
    }
  `;

  @property() address!: string;
  @consume({ context: connectionContext, subscribe: true })
  connection!: Connection;
  @consume({ context: userContext, subscribe: true })
  userState!: UserState;

  // Add debug methods to check if userState changes are being received
  connectedCallback() {
    super.connectedCallback();
    console.log('ViewProfile connected, userState:', {
      address: this.userState?.address,
      isConnected: this.userState?.isConnected,
      profile: this.userState?.profile ? 'has profile' : 'no profile'
    });
    
    // Add a listener for user connection events
    document.addEventListener(USER_CONNECTED_EVENT, this.handleUserConnected);
  }
  
  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener(USER_CONNECTED_EVENT, this.handleUserConnected);
  }
  
  private handleUserConnected = (event: Event) => {
    console.log('User connected event received in view-profile:', event);
    // Force a re-render
    this.requestUpdate();
  }

  private readonly profile = new Task(this, {
    task: async ([userId]) => {
      // If viewing the current user and we already have their profile, use it
      if (
        this.userState?.isConnected && 
        userId === this.userState.address && 
        this.userState.profile
      ) {
        console.log('Using cached user profile from userState');
        return this.userState.profile;
      }
      
      // Otherwise fetch the profile
      console.log('Fetching profile for:', userId);
      const result = await urqlClient.query(ProfileDocument, { userId });
      if (result.data?.user?.profile) {
        return JSON.parse(
          fromHex(result.data.user.profile as `0x${string}`, 'string')
        );
      }
      return null;
    },
    args: () => [this.address] as const,
  });

  private handleFollow(): void {
    followUser(this.address);
    markComplete('follow-someone');
  }

  private get profileButton() {
    // Get direct access to the wallet address (not through userState)
    const walletAddress = userAddress.get()?.toLowerCase() || '';
    const profileAddress = this.address?.toLowerCase() || '';
    const walletConnected = isConnected.get();
    
    // Determine if the user is viewing their own profile
    const isCurrentUser = walletConnected && walletAddress === profileAddress;
    
    console.log('ProfileButton detailed comparison:', {
      // Direct signal values
      walletAddress,
      walletConnected,
      // Context values
      userStateAddress: this.userState?.address?.toLowerCase(),
      userStateConnected: this.userState?.isConnected,
      // Profile values
      profileAddress,
      // Results
      isCurrentUser,
      isCurrentUserViaContext: this.userState?.isConnected && 
        this.userState?.address?.toLowerCase() === profileAddress
    });

    // If the address is the current user's address, show Edit Profile button
    if (isCurrentUser) {
      return html`
        <sl-button variant="primary" href="/edit-profile"
          >Edit profile
        </sl-button>
      `;
    } else {
      // Otherwise, show Follow/Unfollow button
      if (isFollowed(this.address)) {
        return html` <sl-button
          variant="primary"
          @click=${() => unfollowUser(this.address)}
          >Unfollow
        </sl-button>`;
      } else {
        return html` <sl-button variant="primary" @click=${this.handleFollow}
          >Follow
        </sl-button>`;
      }
    }
  }

  private createLink(link: string) {
    let url;
    try {
      url = new URL(link);
    } catch {
      try {
        url = new URL(`https://${link}`);
      } catch {
        return;
      }
    }
    const pathname = url.pathname.replace(/^\/+/, ''); // strip leading slashes
    return html`
      <a class="link" href="${url.href}" target="_blank">
        <img
          src=${`https://www.google.com/s2/favicons?domain=${link}&sz=16`}
          @error=${(e: Event) => this.handleImageError(e)}
          alt="Logo for ${link}"
          width="16px"
          height="16px"
        />
        <span>${pathname || url.host}</span>
      </a>
    `;
  }

  private handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = '/src/assets/icons/link-45deg.svg'; // Fallback icon
  }

  updated(changedProperties: Map<string, unknown>) {
    // If the address changes, re-run the profile task
    if (changedProperties.has('address')) {
      // Force re-evaluation of profile task with new address
      this.profile.run();
    }
  }

  render() {
    // Direct access to the wallet address
    const directWalletAddr = userAddress.get();
    const directIsConnected = isConnected.get();
    
    // Get via context
    const contextWalletAddr = this.userState?.address;
    const contextIsConnected = this.userState?.isConnected;
    
    // Profile address
    const profileAddr = this.address;
    
    // Calculate equality
    const isDirectMatch = directIsConnected && 
                          directWalletAddr?.toLowerCase() === profileAddr?.toLowerCase();
    const isContextMatch = contextIsConnected && 
                           contextWalletAddr?.toLowerCase() === profileAddr?.toLowerCase();
    
    console.log('View-profile detailed state:', {
      // Direct values
      directWalletAddr,
      directIsConnected,
      // Context values
      contextWalletAddr,
      contextIsConnected,
      // Profile
      profileAddr,
      // Comparison
      isDirectMatch,
      isContextMatch
    });
    
    return html`
      <div class="container">
        <main>
          <!-- Debug Info (remove in production) -->
          <div style="background-color: #f5f5f5; padding: 10px; margin-bottom: 10px; font-family: monospace; font-size: 12px;">
            <p>Direct wallet: ${directWalletAddr || 'null'} (connected: ${directIsConnected})</p>
            <p>Context wallet: ${contextWalletAddr || 'null'} (connected: ${contextIsConnected})</p>
            <p>Profile: ${profileAddr || 'null'}</p>
            <p>Is Own Profile: ${isDirectMatch ? 'YES (direct)' : isContextMatch ? 'YES (context)' : 'NO'}</p>
          </div>
          
          ${this.profile.render({
            pending: () => html`<p>Loading profile...</p>`,
            complete: (value) => {
              const { name, team, image, about, news, links } = value || {};
              return html`
                <div class="profile-header">
                  <div class="avatar">
                    <img
                      src="${image || makeBlockie(this.address)}"
                      alt="Profile avatar"
                    />
                  </div>
                  <div>
                    ${name || team
                      ? html` <h1 class="name">${name || team}</h1>`
                      : ''}
                    <div class="address">${this.address}</div>
                    ${name && team
                      ? html` <div class="team">${team}</div>`
                      : ''}
                  </div>
                </div>

                ${this.profileButton}
                ${about
                  ? html`
                      <div class="about section">
                        <h2>About</h2>
                        <p>${about}</p>
                      </div>
                    `
                  : ''}
                ${news
                  ? html`
                      <div class="news section">
                        <h2>Latest Updates</h2>
                        <p>${news}</p>
                      </div>
                    `
                  : ''}
                ${links?.length
                  ? html`
                      <div class="links section">
                        <h2>Links</h2>
                        ${links.map((link: string) => this.createLink(link))}
                      </div>
                    `
                  : ''}
              `;
            },
            error: (error) => html`<p>Error loading profile: ${error.message}</p>`
          })}
        </main>
        ${this.address
          ? html` <activity-feed
              .userId=${this.address}
              .userName=${this.profile.value?.name}
            ></activity-feed>`
          : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'view-profile': ViewProfile;
  }
}
