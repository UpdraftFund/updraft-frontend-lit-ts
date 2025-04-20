import { customElement, property } from 'lit/decorators.js';
import { css, LitElement } from 'lit';
import { SignalWatcher, html } from '@lit-labs/signals';
import { Task } from '@lit/task';

import { fromHex } from 'viem';

import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@layout/page-heading';
import '@/features/user/components/activity-feed';
import '@/features/user/components/user-avatar';

import {
  userAddress,
  isConnected,
  userProfile,
  USER_CONNECTED_EVENT,
  USER_DISCONNECTED_EVENT,
  USER_PROFILE_UPDATED_EVENT,
} from '@state/user';
import { followUser, isFollowed, unfollowUser } from '@state/user/follow';
import { markComplete } from '@pages/home/state/beginner-tasks';

import urqlClient from '@utils/urql-client';
import { ProfileDocument } from '@gql';
import { topBarContent } from '@state/layout';

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

  private async fetchUserProfile(address: string) {
    const result = await urqlClient
      .query(ProfileDocument, { userId: address })
      .toPromise();
    return result.data?.user?.profile;
  }

  private async loadProfile(address: string) {
    if (!address) return;

    try {
      const profile = await this.fetchUserProfile(address);
      if (profile) {
        userProfile.set(profile);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  }

  connectedCallback() {
    super.connectedCallback();

    // Load profile if not already loaded
    if (!userProfile.get() && this.address) {
      this.loadProfile(this.address);
    }

    // Set page title
    topBarContent.set(html`<page-heading>Profile</page-heading>`);

    // Add listeners for user state events to trigger updates
    document.addEventListener(
      USER_CONNECTED_EVENT,
      this.handleUserStateChanged
    );
    document.addEventListener(
      USER_DISCONNECTED_EVENT,
      this.handleUserStateChanged
    );
    document.addEventListener(
      USER_PROFILE_UPDATED_EVENT,
      this.handleUserStateChanged
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    topBarContent.set(html``);

    // Remove event listeners
    document.removeEventListener(
      USER_CONNECTED_EVENT,
      this.handleUserStateChanged
    );
    document.removeEventListener(
      USER_DISCONNECTED_EVENT,
      this.handleUserStateChanged
    );
    document.removeEventListener(
      USER_PROFILE_UPDATED_EVENT,
      this.handleUserStateChanged
    );
  }

  private handleUserStateChanged = () => {
    // Force a re-render when user state changes
    this.requestUpdate();
  };

  // Task for fetching profile data
  private readonly profile = new Task(this, {
    task: async ([userId]) => {
      if (!userId) return null;

      // If viewing the current user and we already have their profile, use it
      const currentUserAddress = userAddress.get();
      const currentUserProfile = userProfile.get();

      if (
        currentUserAddress &&
        userId.toLowerCase() === currentUserAddress.toLowerCase() &&
        currentUserProfile
      ) {
        return currentUserProfile;
      }

      // Otherwise fetch the profile
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

  // Task for checking follow status
  private readonly followStatus = new Task(this, {
    task: async ([userId]) => {
      if (!userId) return false;
      return isFollowed(userId);
    },
    args: () => [this.address] as const,
  });

  private handleFollow(): void {
    followUser(this.address);
    markComplete('follow-someone');
    // Re-run follow status task to update UI
    this.followStatus.run();
  }

  private get profileButton() {
    // Get data from signals
    const walletAddress = userAddress.get()?.toLowerCase() || '';
    const profileAddress = this.address?.toLowerCase() || '';
    const walletConnected = isConnected.get();

    // Determine if the user is viewing their own profile
    const isCurrentUser = walletConnected && walletAddress === profileAddress;

    // If the address is the current user's address, show Edit Profile button
    if (isCurrentUser) {
      return html`
        <sl-button variant="primary" href="/edit-profile">
          Edit profile
        </sl-button>
      `;
    } else {
      // Otherwise, show Follow/Unfollow button based on follow status task
      return html`
        ${this.followStatus.render({
          pending: () =>
            html`<sl-button variant="primary" disabled>Loading...</sl-button>`,
          complete: (isFollowing) => {
            if (isFollowing) {
              return html` <sl-button
                variant="primary"
                @click=${() => {
                  unfollowUser(this.address);
                  this.followStatus.run();
                }}
              >
                Unfollow
              </sl-button>`;
            } else {
              return html` <sl-button
                variant="primary"
                @click=${this.handleFollow}
              >
                Follow
              </sl-button>`;
            }
          },
          error: () =>
            html`<sl-button variant="primary" disabled>Error</sl-button>`,
        })}
      `;
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
    // If the address changes, re-run the profile and follow status tasks
    if (changedProperties.has('address')) {
      this.profile.run();
      this.followStatus.run();
    }
  }

  render() {
    return html`
      <div class="container">
        <main>
          ${this.profile.render({
            pending: () => html`<p>Loading profile...</p>`,
            complete: (value) => {
              const { name, team, image, about, news, links } = value || {};
              return html`
                <div class="profile-header">
                  <user-avatar
                    .address=${this.address}
                    .imageUrl=${image || ''}
                    size="64px"
                  ></user-avatar>
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
            error: (error: unknown) => {
              const errorMessage =
                error instanceof Error ? error.message : String(error);
              return html`<p>Error loading profile: ${errorMessage}</p>`;
            },
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
