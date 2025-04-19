import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { cache } from 'lit/directives/cache.js';

import { fromHex, formatUnits } from 'viem';
import makeBlockie from 'ethereum-blockies-base64';

import '@shoelace-style/shoelace/dist/components/avatar/avatar.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

import urqlClient from '@utils/urql-client';
import { IdeaContributionsDocument } from '@gql';
import { shortNum } from '@utils/short-num';

import { Profile } from '@/types';

interface Supporter {
  id: string;
  profile?: string;
  name?: string;
  avatar?: string;
  contribution: string;
}

@customElement('top-supporters')
export class TopSupporters extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1rem;
    }

    h2 {
      margin-top: 0;
      font-size: 1.25rem;
    }

    .supporters-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .supporter {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .supporter-info {
      flex: 1;
    }

    .supporter-name {
      font-weight: 500;
      font-size: 0.9rem;
      color: var(--main-foreground);
      text-decoration: none;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: block;
    }

    .supporter-name:hover {
      color: var(--accent);
    }

    .supporter-contribution {
      font-size: 0.8rem;
      color: var(--section-heading);
    }

    .no-supporters {
      color: var(--sl-color-neutral-500);
      font-style: italic;
    }
  `;

  @property({ type: String }) ideaId = '';
  @state() private supporters?: Supporter[];
  private unsubscribe?: () => void;

  private subscribe() {
    // Disconnect any previous subscriptions
    this.unsubscribe?.();

    if (!this.ideaId) {
      this.supporters = [];
      return;
    }

    const supportersSub = urqlClient
      .query(IdeaContributionsDocument, {
        ideaId: this.ideaId,
        first: 5,
        skip: 0,
      })
      .subscribe((result) => {
        if (!result.data?.ideaContributions) {
          this.supporters = [];
        } else {
          this.supporters = result.data.ideaContributions.map(
            (contribution) => {
              let name = contribution.funder.id;
              let avatar = makeBlockie(contribution.funder.id);

              if (contribution.funder.profile) {
                try {
                  const profile: Profile = JSON.parse(
                    fromHex(
                      contribution.funder.profile as `0x${string}`,
                      'string'
                    )
                  );
                  name = profile.name || profile.team || contribution.funder.id;
                  avatar = profile.image || avatar;
                } catch (e) {
                  console.error('Error parsing profile', e);
                }
              }

              return {
                id: contribution.funder.id,
                name,
                avatar,
                contribution: contribution.contribution,
              };
            }
          );
        }
      });

    this.unsubscribe = supportersSub.unsubscribe;
  }

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.unsubscribe?.();
    } else {
      this.subscribe();
    }
  };

  connectedCallback() {
    super.connectedCallback();
    if (this.ideaId) {
      this.subscribe();
    }
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribe?.();
    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange
    );
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('ideaId')) {
      this.subscribe();
    }
  }

  render() {
    return html`
      <div>
        <h2>Top Supporters</h2>
        ${this.supporters === undefined
          ? html` <sl-spinner></sl-spinner>`
          : cache(
              this.supporters.length === 0
                ? html` <div class="no-supporters">No supporters yet</div>`
                : html`
                    <div class="supporters-list">
                      ${this.supporters.map(
                        (supporter) => html`
                          <div class="supporter">
                            <sl-avatar
                              image="${supporter.avatar}"
                              label="Avatar for ${supporter.name}"
                            ></sl-avatar>
                            <div class="supporter-info">
                              <a
                                href="/profile/${supporter.id}"
                                class="supporter-name"
                                >${supporter.name}</a
                              >
                              <div class="supporter-contribution">
                                ${shortNum(
                                  formatUnits(
                                    BigInt(supporter.contribution),
                                    18
                                  )
                                )}
                                UPD
                              </div>
                            </div>
                          </div>
                        `
                      )}
                    </div>
                  `
            )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'top-supporters': TopSupporters;
  }
}
