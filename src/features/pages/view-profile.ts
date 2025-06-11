import { customElement, property, state } from 'lit/decorators.js';
import { css, LitElement } from 'lit';
import { SignalWatcher, html } from '@lit-labs/signals';
import { cache } from 'lit/directives/cache.js';

import { fromHex } from 'viem';

import '@shoelace-style/shoelace/dist/components/button/button.js';

import '@components/navigation/search-bar';
import '@components/navigation/create-idea-button';
import '@components/user/activity-feed';
import '@components/user/user-avatar';

import { UrqlQueryController } from '@utils/urql-query-controller';

import layout from '@state/layout';
import { userAddress } from '@state/user';
import { followUser, isFollowed, unfollowUser } from '@state/user/follow';
import { markComplete } from '@state/user/beginner-tasks';

import { ProfileDocument } from '@gql';
import { Profile } from '@/features/user/types/profile';
import { shortenAddress, formattedText } from '@utils/format-utils';

@customElement('view-profile')
export class ViewProfile extends SignalWatcher(LitElement) {
  static styles = css`
    main {
      display: flex;
      flex-direction: column;
      flex: 1;
      gap: 1rem;
      box-sizing: border-box;
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

    user-avatar {
      --avatar-size: 64px;
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
      color: var(--link);
    }
  `;

  @property() address!: string;
  @state() private profileData: Profile | null = null;
  @state() private loading = true;
  @state() private error: Error | null = null;

  // Controller for fetching profile data
  private readonly profileController = new UrqlQueryController(
    this,
    ProfileDocument,
    { userId: this.address || '' },
    (result) => {
      this.loading = false;

      if (result.error) {
        this.error = new Error(result.error.message);
        return;
      }

      if (result.data?.user?.profile) {
        try {
          this.profileData = JSON.parse(
            fromHex(result.data.user.profile as `0x${string}`, 'string')
          );

          // Update the activity feed in the right sidebar
          if (this.profileData) {
            const { name, team } = this.profileData;
            layout.rightSidebarContent.set(
              html` <activity-feed
                .userId=${this.address}
                .userName=${name || team || shortenAddress(this.address)}
              ></activity-feed>`
            );
          }
        } catch (e) {
          this.error =
            e instanceof Error ? e : new Error('Failed to parse profile data');
        }
      } else {
        this.profileData = null;
      }
    }
  );

  private handleFollow(): void {
    followUser(this.address);
    markComplete('follow-someone');
  }

  private get profileButton() {
    const walletAddress = userAddress.get()?.toLowerCase() || '';
    const profileAddress = this.address?.toLowerCase() || '';
    const isCurrentUser = walletAddress === profileAddress;

    // If the address is the current user's address, show Edit Profile button
    if (isCurrentUser) {
      return html`
        <sl-button variant="primary" href="/edit-profile">
          Edit profile
        </sl-button>
      `;
    } else {
      // Otherwise, show Follow/Unfollow button based on follow status task
      if (isFollowed(this.address)) {
        return html` <sl-button
          variant="primary"
          @click=${() => {
            unfollowUser(this.address);
          }}
        >
          Unfollow
        </sl-button>`;
      } else {
        return html` <sl-button variant="primary" @click=${this.handleFollow}>
          Follow
        </sl-button>`;
      }
    }
  }

  private createLink(link: string) {
    if (!link.trim()) {
      return;
    }

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

  connectedCallback() {
    super.connectedCallback();
    layout.topBarContent.set(html`
      <create-idea-button></create-idea-button>
      <search-bar></search-bar>
    `);
    layout.showLeftSidebar.set(true);
    layout.showRightSidebar.set(true);
    layout.rightSidebarContent.set(
      html` <activity-feed
        .userId=${this.address}
        .userName=${shortenAddress(this.address)}
      ></activity-feed>`
    );

    // Initialize the profile controller with the current address
    if (this.address) {
      this.profileController.setVariablesAndSubscribe({ userId: this.address });
    }
  }

  updated(changedProperties: Map<string, unknown>) {
    // If the address changes, update the controller variables
    if (changedProperties.has('address') && this.address) {
      this.loading = true;
      this.error = null;
      this.profileController.setVariablesAndSubscribe({ userId: this.address });
    }
  }

  render() {
    return html`
      <main>
        ${this.loading
          ? html`<p>Loading profile...</p>`
          : this.error
            ? html`<p>Error loading profile: ${this.error.message}</p>`
            : cache(html`
                <div class="profile-header">
                  <user-avatar
                    .address=${this.address}
                    .image=${this.profileData?.image}
                  ></user-avatar>
                  <div>
                    ${this.profileData?.name || this.profileData?.team
                      ? html` <h1 class="name">
                          ${this.profileData?.name || this.profileData?.team}
                        </h1>`
                      : html``}
                    <div class="address">${this.address}</div>
                    ${this.profileData?.team && this.profileData?.name
                      ? html` <div class="team">${this.profileData.team}</div>`
                      : html``}
                  </div>
                </div>

                ${this.profileButton}
                ${this.profileData?.about
                  ? html`
                      <div class="about section">
                        <h2>About</h2>
                        <p>${formattedText(this.profileData.about)}</p>
                      </div>
                    `
                  : html``}
                ${this.profileData?.news
                  ? html`
                      <div class="news section">
                        <h2>Latest Updates</h2>
                        <p>${formattedText(this.profileData.news)}</p>
                      </div>
                    `
                  : html``}
                ${this.profileData?.links?.some((link) => link.trim() !== '')
                  ? html`
                      <div class="links section">
                        <h2>Links</h2>
                        ${this.profileData!.links.map((link: string) =>
                          this.createLink(link)
                        )}
                      </div>
                    `
                  : html``}
              `)}
      </main>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'view-profile': ViewProfile;
  }
}
