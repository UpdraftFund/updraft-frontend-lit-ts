import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { cache } from 'lit/directives/cache.js';

import { fromHex, formatUnits } from 'viem';

import '@shoelace-style/shoelace/dist/components/avatar/avatar.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

import '@components/user/user-avatar';

import { UrqlQueryController } from '@utils/urql-query-controller';
import { SolutionContributionsDocument } from '@gql';
import { shortNum } from '@utils/format-utils';

import { Profile } from '@/types';

interface Funder {
  id: string;
  profile?: string;
  name?: string;
  avatar?: string;
  contribution: string;
}

@customElement('top-funders')
export class TopFunders extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1rem;
    }

    h2 {
      margin-top: 0;
      font-size: 1.25rem;
    }

    .funders-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .funder {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .funder-info {
      flex: 1;
    }

    .funder-name {
      font-weight: 500;
      font-size: 0.9rem;
      color: var(--main-foreground);
      text-decoration: none;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: block;
    }

    .funder-name:hover {
      color: var(--accent);
    }

    .funder-contribution {
      font-size: 0.8rem;
      color: var(--subtle-text);
    }

    .no-funders {
      color: var(--no-results);
      font-style: italic;
    }
  `;

  @property({ type: String }) solutionId = '';
  @state() private funders?: Funder[];

  // Controller for fetching top funders
  private readonly fundersController = new UrqlQueryController(
    this,
    SolutionContributionsDocument,
    {
      solutionId: this.solutionId || '',
      first: 5,
      skip: 0,
    },
    (result) => {
      if (result.error) {
        console.error('Error fetching funders:', result.error);
        this.funders = [];
        return;
      }

      if (!result.data?.solutionContributions) {
        this.funders = [];
      } else {
        // Use a Map to combine contributions from the same funder
        const funderMap = new Map<string, Funder>();

        result.data.solutionContributions.forEach((contribution) => {
          const funderId = contribution.funder.id;
          if (funderMap.has(funderId)) {
            const existingFunder = funderMap.get(funderId)!;
            const newContribution =
              BigInt(existingFunder.contribution) +
              BigInt(contribution.contribution);
            funderMap.set(funderId, {
              ...existingFunder,
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
            funderMap.set(funderId, {
              id: funderId,
              name,
              avatar,
              contribution: contribution.contribution,
            });
          }
        });

        // Convert map to array and sort by contribution amount (descending)
        this.funders = Array.from(funderMap.values()).sort((a, b) => {
          return BigInt(b.contribution) > BigInt(a.contribution) ? 1 : -1;
        });
      }
    }
  );

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('solutionId')) {
      if (this.solutionId) {
        this.fundersController.setVariablesAndSubscribe({
          solutionId: this.solutionId,
          first: 5,
          skip: 0,
        });
      } else {
        this.funders = [];
      }
    }
  }

  render() {
    return html`
      <div>
        <h2>Top Funders</h2>
        ${this.funders === undefined
          ? html` <sl-spinner></sl-spinner>`
          : this.funders.length === 0
            ? html` <div class="no-funders">No funders yet</div>`
            : cache(html`
                <div class="funders-list">
                  ${this.funders.map(
                    (funder) => html`
                      <div class="funder">
                        <user-avatar
                          .image=${funder.avatar}
                          .address=${funder.id}
                        ></user-avatar>
                        <div class="funder-info">
                          <a href="/profile/${funder.id}" class="funder-name"
                            >${funder.name}</a
                          >
                          <div class="funder-contribution">
                            ${shortNum(
                              formatUnits(BigInt(funder.contribution), 18)
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
    'top-funders': TopFunders;
  }
}
