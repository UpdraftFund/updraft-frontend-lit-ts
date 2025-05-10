import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { cache } from 'lit/directives/cache.js';

import { fromHex, formatUnits } from 'viem';

import '@shoelace-style/shoelace/dist/components/avatar/avatar.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

import '@components/user/user-avatar';

import { UrqlQueryController } from '@utils/urql-query-controller';
import { IdeaContributionsDocument } from '@gql';
import { shortNum } from '@utils/format-utils';

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
      color: var(--subtle-text);
    }

    .no-supporters {
      color: var(--no-results);
      font-style: italic;
    }
  `;

  @property({ type: String }) ideaId = '';
  @state() private supporters?: Supporter[];

  // Controller for fetching top supporters
  private readonly supportersController = new UrqlQueryController(
    this,
    IdeaContributionsDocument,
    {
      ideaId: this.ideaId || '',
      first: 5,
      skip: 0,
    },
    (result) => {
      if (result.error) {
        console.error('Error fetching supporters:', result.error);
        this.supporters = [];
        return;
      }

      if (!result.data?.ideaContributions) {
        this.supporters = [];
      } else {
        // Use a Map to combine contributions from the same supporter
        const supporterMap = new Map<string, Supporter>();

        result.data.ideaContributions.forEach((contribution) => {
          const funderId = contribution.funder.id;
          if (supporterMap.has(funderId)) {
            const existingSupporter = supporterMap.get(funderId)!;
            const newContribution =
              BigInt(existingSupporter.contribution) +
              BigInt(contribution.contribution);
            supporterMap.set(funderId, {
              ...existingSupporter,
              contribution: newContribution.toString(),
            });
          } else {
            let name = funderId;
            let avatar;

            if (contribution.funder.profile) {
              try {
                const profile: Profile = JSON.parse(
                  fromHex(
                    contribution.funder.profile as `0x${string}`,
                    'string'
                  )
                );
                name = profile.name || profile.team || funderId;
                avatar = profile.image;
              } catch (e) {
                console.error('Error parsing profile', e);
              }
            }
            supporterMap.set(funderId, {
              id: funderId,
              name,
              avatar,
              contribution: contribution.contribution,
            });
          }
        });

        // Convert map to array and sort by contribution amount (descending)
        this.supporters = Array.from(supporterMap.values()).sort((a, b) => {
          return BigInt(b.contribution) > BigInt(a.contribution) ? 1 : -1;
        });
      }
    }
  );

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('ideaId')) {
      if (this.ideaId) {
        this.supportersController.setVariablesAndSubscribe({
          ideaId: this.ideaId,
          first: 5,
          skip: 0,
        });
      } else {
        this.supporters = [];
      }
    }
  }

  render() {
    return html`
      <div>
        <h2>Top Supporters</h2>
        ${this.supporters === undefined
          ? html` <sl-spinner></sl-spinner>`
          : this.supporters.length === 0
            ? html` <div class="no-supporters">No supporters yet</div>`
            : cache(html`
                <div class="supporters-list">
                  ${this.supporters.map(
                    (supporter) => html`
                      <div class="supporter">
                        <user-avatar
                          .image=${supporter.avatar}
                          .address=${supporter.id}
                        ></user-avatar>
                        <div class="supporter-info">
                          <a
                            href="/profile/${supporter.id}"
                            class="supporter-name"
                            >${supporter.name}</a
                          >
                          <div class="supporter-contribution">
                            ${shortNum(
                              formatUnits(BigInt(supporter.contribution), 18)
                            )}
                            UPD
                          </div>
                        </div>
                      </div>
                    `
                  )}
                </div>
              `)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'top-supporters': TopSupporters;
  }
}
