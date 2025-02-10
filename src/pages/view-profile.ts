import { customElement, property } from "lit/decorators.js";
import { css, html, LitElement } from "lit";
import { consume } from "@lit/context";
import { Task } from '@lit/task';

import { fromHex } from "viem";
import makeBlockie from 'ethereum-blockies-base64';

import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '../components/layout/top-bar'
import '../components/layout/page-heading.ts'
import '../components/layout/left-side-bar.ts'
import '../components/layout/activity-feed.ts'

import { User, userContext } from '../context';

import urqlClient from '../urql-client';
import { ProfileDocument } from '../../.graphclient';

@customElement('view-profile')
export class ViewProfile extends LitElement {
  static styles = css`
    .container {
      display: flex;
      flex: 1 1 auto;
      overflow: hidden;
    }

    left-side-bar {
      flex: 0 0 274px;
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
      font-weight: 600;
    }

    .address {
      max-width: 158px;
      white-space: nowrap; /* Prevent text from wrapping to the next line */
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: 300;
      color: var(--subtle-text);
      font-size: 0.9rem;
    }

    .team {
      font-size: 0.9rem;
    }
    
    sl-button {
      max-width: 158px;
    }

    .section-heading {
      font-size: 1.2rem;
      margin-bottom: 0.5rem;
    }

    .links-section {
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

    @media (max-width: 1415px) {
      left-side-bar {
        flex: 0 0 0;
        pointer-events: none;
      }
    }

    @media (max-width: 1090px) {
      activity-feed {
        flex: 0 0 0;
        pointer-events: none;
      }
    }
  `;

  @property() address!: string;

  @consume({ context: userContext, subscribe: true }) user!: User;

  private readonly profile = new Task(this, {
    task: async () => {
      if (this.address) {
        let result;
        try {
          result = await urqlClient.query(ProfileDocument, { userId: this.address });
          if (result.data?.user?.profile) {
            return JSON.parse(fromHex(result.data.user.profile as `0x${string}`, 'string'));
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          console.dir(result);
        }
      }
    },
    args: () => [this.address] as const
  });

  private get profileButton() {
    if (this.address === this.user?.address) {
      return html`
        <sl-button variant="primary" href="/edit-profile">Edit profile</sl-button>
      `
    } else {
      return html`
        <sl-button variant="primary">Follow</sl-button>
      `
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
      <top-bar></top-bar>
      <div class="container">
        <left-side-bar></left-side-bar>
        <main>
          ${this.profile.render({
            complete: (value) => {
              const { name, team, image, about, news, links } = value || {};
              return html`
                <div class="profile-header">
                  <div class="avatar">
                    <img src="${image || makeBlockie(this.address)}" alt="Profile avatar">
                  </div>
                  <div>
                    ${name || team ? html`
                      <h1 class="name">${name || team}</h1>
                    ` : ''}
                    <div class="address">${this.address}</div>
                    ${name && team ? html`
                      <div class="team">${team}</div>
                    ` : ''}
                  </div>
                </div>

                ${this.profileButton}

                ${about ? html`
                  <div class="about-section">
                    <h4 class="section-heading">About</h4>
                    <p>${about}</p>
                  </div>
                ` : ''}

                ${news ? html`
                  <div class="news-section">
                    <h4 class="section-heading">Latest Updates</h4>
                    <p>${news}</p>
                  </div>
                ` : ''}

                ${links?.length ? html`
                  <div class="links-section">
                    <h4 class="section-heading">Links</h4>
                    ${links.map((link: string) => this.createLink(link))}
                  </div>
                ` : ''}
              `
            }
          })}
        </main>
        <activity-feed></activity-feed>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'view-profile': ViewProfile;
  }
}