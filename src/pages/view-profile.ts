import { customElement, property } from 'lit/decorators.js';
import { css, LitElement } from 'lit';
import { SignalWatcher, html } from '@lit-labs/signals';
import { consume } from '@lit/context';
import { Task } from '@lit/task';

import { fromHex } from 'viem';
import makeBlockie from 'ethereum-blockies-base64';

import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';

import '@components/top-bar/page-heading';
import '@/components/page-specific/profile/activity-feed';

import { connectionContext } from '@/context';
import { userContext, UserState } from '@/state/user-state';
import { followUser, isFollowed, unfollowUser } from '@state/follow-state.ts';
import { markComplete } from '@state/beginner-tasks-state.ts';
import { Connection } from '@/types';

import urqlClient from '@/urql-client';
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

  private readonly profile = new Task(this, {
    task: async ([userId]) => {
      const result = await urqlClient.query(ProfileDocument, { userId });
      if (result.data?.user?.profile) {
        return JSON.parse(
          fromHex(result.data.user.profile as `0x${string}`, 'string')
        );
      }
    },
    args: () => [this.address] as const,
  });

  private handleFollow(): void {
    followUser(this.address);
    markComplete('follow-someone');
  }

  private get profileButton() {
    // Check if the viewed profile belongs to the current user using both legacy and new state
    const isCurrentUser =
      (this.userState?.isConnected &&
        this.address === this.userState.address) ||
      (this.connection?.connected && this.address === this.connection.address);

    if (isCurrentUser) {
      return html`
        <sl-button variant="primary" href="/edit-profile"
          >Edit profile
        </sl-button>
      `;
    } else {
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

  render() {
    return html`
      <div class="container">
        <main>
          ${this.profile.render({
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
