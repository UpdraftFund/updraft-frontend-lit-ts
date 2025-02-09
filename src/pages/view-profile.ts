import { customElement, state, property } from "lit/decorators.js";
import { css, html, LitElement } from "lit";
import { consume } from "@lit/context";
import { Task } from '@lit/task';

import { fromHex } from "viem";
import makeBlockie from 'ethereum-blockies-base64';

import '@shoelace-style/shoelace/dist/components/card/card.js';
import '../components/layout/top-bar'
import '../components/layout/page-heading.ts'
import '../components/layout/left-side-bar.ts'
import '../components/layout/activity-feed.ts'

import urqlClient from '../urql-client';
import { User, userContext } from '../context';

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
    }

    .profile-content {
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
      margin: 1rem 3rem;
      color: var(--main-foreground);
    }

    .avatar {
      background: var(--main-background);
      border-radius: 50%;
      width: 64px;
      height: 64px;
      padding: 0.2rem;
      display: flex;
    }

    .avatar img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: var(--sl-color-neutral-200);
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .profile-info {
      margin-top: 1rem;
    }

    .address {
      display: inline-block; /* Ensures the span respects the width */
      max-width: 145px;
      white-space: nowrap; /* Prevent text from wrapping to the next line */
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: 300;
      color: var(--subtle-text);
      font-size: 0.8rem;
      margin-top: 0.2rem;
      margin-bottom: 0.5rem;
      text-align: center;
    }

    .profile-info h3 {
      margin: 0;
      font-size: 1.5rem;
    }

    .profile-info .team {
      color: var(--sl-color-neutral-500);
      margin: 0.5rem 0;
    }

    .about-section, .news-section, .links-section {
      margin-top: 1.5rem;
    }

    .section-heading {
      font-size: 1.2rem;
      margin-bottom: 0.5rem;
    }

    .links-section a {
      color: var(--sl-color-primary-600);
      text-decoration: none;
    }

    .links-section a:hover {
      text-decoration: underline;
    }

    @media (max-width: 1415px) {
      left-side-bar {
        flex: 0 0 0;
        pointer-events: none;
      }
    }

    @media (max-width: 1078px) {
      activity-feed {
        flex: 0 0 0;
        pointer-events: none;
      }
    }
  `;

  @property()
  address!: string;

  @consume({ context: userContext })
  @state()
  user?: User;

  private readonly profile = new Task(this, {
    task: async () => {
      if (this.address) {
        let result;
        try {
          result = await urqlClient.query(ProfileDocument, { userId: this.address });
          if(result.data?.user?.profile) {
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

  render() {
    return html`
      <top-bar></top-bar>
      <div class="container">
        <left-side-bar></left-side-bar>
        <main>
          ${this.profile.render({
            complete: (value) => html`
              <div class="profile-content">
                <div class="profile-header">
                  <div class="avatar">
                    <img src="${value?.image || makeBlockie(this.address)}" alt="Profile avatar">
                  </div>
                  <div>
                    ${value?.name ? html`
                      <h3>${value.name}</h3>
                    ` : ''}
                    <span class="address">${this.address}</span>
                    ${value?.team ? html`
                      <p class="team">${value.team}</p>
                    ` : ''}
                  </div>
                </div>

                ${value?.about ? html`
                  <div class="about-section">
                    <h4 class="section-heading">About</h4>
                    <p>${value.about}</p>
                  </div>
                ` : ''}

                ${value?.news ? html`
                  <div class="news-section">
                    <h4 class="section-heading">Latest Updates</h4>
                    <p>${value.news}</p>
                  </div>
                ` : ''}

                ${value?.links?.length ? html`
                  <div class="links-section">
                    <h4 class="section-heading">Links</h4>
                    ${value.links.map((link: string) => html`
                      <p><a href="${link}" target="_blank" rel="noopener noreferrer">${link}</a></p>
                    `)}
                  </div>
                ` : ''}
              </div>
            `
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