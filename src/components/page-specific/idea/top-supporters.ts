import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Task } from '@lit/task';
import { fromHex, formatUnits } from 'viem';
import makeBlockie from 'ethereum-blockies-base64';

import '@shoelace-style/shoelace/dist/components/avatar/avatar.js';

import urqlClient from '@/urql-client';
import { IdeaContributionsDocument } from '@gql';
import { shortNum } from '@/utils';

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

  @property({ type: String })
  ideaId = '';

  private fetchSupporters = new Task(
    this,
    async ([ideaId]) => {
      if (!ideaId) return [];

      const result = await urqlClient.query(IdeaContributionsDocument, {
        ideaId,
        first: 5,
        skip: 0,
      });

      if (!result.data?.ideaContributions) return [];

      return result.data.ideaContributions.map(
        (contribution: any): Supporter => {
          let name = contribution.funder.id;
          let avatar = makeBlockie(contribution.funder.id);

          if (contribution.funder.profile) {
            try {
              const profile = JSON.parse(
                fromHex(contribution.funder.profile as `0x${string}`, 'string')
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
    },
    () => [this.ideaId]
  );

  render() {
    return html`
      <div>
        <h2>Top Supporters</h2>
        ${this.fetchSupporters.render({
          pending: () => html`<sl-spinner></sl-spinner>`,
          error: (error: unknown) =>
            html`<div class="no-supporters">
              Error: ${error instanceof Error ? error.message : String(error)}
            </div>`,
          complete: (supporters) => {
            if (supporters.length === 0) {
              return html`<div class="no-supporters">No supporters yet</div>`;
            }

            return html`
              <div class="supporters-list">
                ${supporters.map(
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
                            formatUnits(BigInt(supporter.contribution), 18)
                          )}
                          UPD
                        </div>
                      </div>
                    </div>
                  `
                )}
              </div>
            `;
          },
        })}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'top-supporters': TopSupporters;
  }
}
