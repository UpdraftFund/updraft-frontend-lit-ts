import { customElement, state, property } from "lit/decorators.js";
import { css, html, LitElement } from "lit";
import { consume } from "@lit/context";
import { Task } from '@lit/task';

import makeBlockie from 'ethereum-blockies-base64';
import urqlClient from '../urql-client';

import { User, userContext } from '../context';

import '@shoelace-style/shoelace/dist/components/card/card.js';
import '../components/layout/top-bar'
import '../components/layout/page-heading.ts'
import '../components/layout/left-side-bar.ts'
import '../components/layout/activity-feed.ts'

import { ProfileDocument } from '../../.graphclient';

interface Profile {
  name?: string;
  team?: string;
  links?: string[];
  image?: string;
  about?: string;
  news?: string;
}

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

  @state()
  private profile?: Profile;

  private fetchProfile = new Task(this, {
    task: async () => {
      if (this.address) {
        try {
          const { data } = await urqlClient.query(ProfileDocument, { userId: this.address });
          if (data?.user?.profile) {
            const fullProfile = JSON.parse(data.user.profile);
            // Extract only the fields we know about from the schema
            this.profile = {
              name: fullProfile.name,
              team: fullProfile.team,
              links: fullProfile.links,
              image: fullProfile.image,
              about: fullProfile.about,
              news: fullProfile.news
            };
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      }
    },
    args: () => [this.address]
  });

  async updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('address')) {
      this.fetchProfile.run();
    }
  }

  render() {
    const avatarSrc = this.profile?.image || makeBlockie(this.address);

    return html`
      <top-bar></top-bar>
      <div class="container">
        <left-side-bar></left-side-bar>
        <main>
          <page-heading>Profile</page-heading>
          <div class="profile-content">
            <div class="profile-header">
              <div class="avatar">
                <img src="${avatarSrc}" alt="Profile avatar">
              </div>
              <div>
                <h3>${this.profile?.name || 'Anonymous'}</h3>
                ${this.profile?.team ? html`
                  <p class="team">${this.profile.team}</p>
                ` : ''}
              </div>
            </div>

            ${this.profile?.about ? html`
              <div class="about-section">
                <h4 class="section-heading">About</h4>
                <p>${this.profile.about}</p>
              </div>
            ` : ''}

            ${this.profile?.news ? html`
              <div class="news-section">
                <h4 class="section-heading">Latest Updates</h4>
                <p>${this.profile.news}</p>
              </div>
            ` : ''}

            ${this.profile?.links?.length ? html`
              <div class="links-section">
                <h4 class="section-heading">Links</h4>
                ${this.profile.links.map(link => html`
                  <p><a href="${link}" target="_blank" rel="noopener noreferrer">${link}</a></p>
                `)}
              </div>
            ` : ''}
          </div>
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