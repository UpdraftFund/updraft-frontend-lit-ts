import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { cache } from 'lit/directives/cache.js';

import { fromHex, formatUnits } from 'viem';

import '@shoelace-style/shoelace/dist/components/avatar/avatar.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

import '@components/user/user-avatar';

import { UrqlQueryController } from '@utils/urql-query-controller';
import { shortNum } from '@utils/format-utils';

import { Profile } from '@/types';
import { TypedDocumentNode } from '@urql/core';
import {
  IdeaContributionsQuery,
  IdeaContributionsQueryVariables,
  SolutionContributionsQuery,
  SolutionContributionsQueryVariables,
} from '@gql';

/**
 * Interface for a contributor (supporter or funder)
 */
export interface Contributor {
  id: string;
  profile?: string;
  name?: string;
  avatar?: string;
  contribution: string;
}

/**
 * Base component for displaying top contributors (supporters or funders)
 * This is an abstract base class that should be extended by specific implementations
 *
 * @template TData - The type of data returned by the GraphQL query (IdeaContributionsQuery or SolutionContributionsQuery)
 * @template TVariables - The type of variables for the GraphQL query (IdeaContributionsQueryVariables or SolutionContributionsQueryVariables)
 */

export abstract class TopContributorsBase<
  TData extends IdeaContributionsQuery | SolutionContributionsQuery,
  TVariables extends
    | IdeaContributionsQueryVariables
    | SolutionContributionsQueryVariables,
> extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1rem;
    }

    h2 {
      margin-top: 0;
      font-size: 1.25rem;
    }

    .contributors-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .contributor {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .contributor-info {
      flex: 1;
    }

    .contributor-name {
      font-weight: 500;
      font-size: 0.9rem;
      color: var(--main-foreground);
      text-decoration: none;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: block;
    }

    .contributor-name:hover {
      color: var(--accent);
    }

    .contributor-contribution {
      font-size: 0.8rem;
      color: var(--subtle-text);
    }

    .no-contributors {
      color: var(--no-results);
      font-style: italic;
    }
  `;

  @property({ type: String }) entityId = '';

  @state() protected contributors?: Contributor[];

  // Properties that are set by subclasses
  protected readonly contributionsDocument: TypedDocumentNode<
    TData,
    TVariables
  >;
  protected readonly entityIdVariableName: string;
  protected readonly contributionsPath: string;
  protected readonly titleText: string;
  protected readonly noContributorsText: string;

  // Controller for fetching top contributors
  protected readonly contributorsController: UrqlQueryController<
    TData,
    TVariables
  >;

  /**
   * Constructor for the base component
   * @param options Configuration options
   */
  constructor(options: {
    contributionsDocument: TypedDocumentNode<TData, TVariables>;
    entityIdVariableName: string;
    contributionsPath: string;
    titleText: string;
    noContributorsText: string;
  }) {
    super();

    this.contributionsDocument = options.contributionsDocument;
    this.entityIdVariableName = options.entityIdVariableName;
    this.contributionsPath = options.contributionsPath;
    this.titleText = options.titleText;
    this.noContributorsText = options.noContributorsText;
    const variables = this.createQueryVariables(this.entityId || '');

    this.contributorsController = new UrqlQueryController(
      this,
      this.contributionsDocument,
      variables,
      (result) => {
        if (result.error) {
          console.error(
            `Error fetching ${this.contributionsPath}:`,
            result.error
          );
          this.contributors = [];
          return;
        }

        // Use proper typing for the data
        const data = result.data as TData | null;

        if (!data) {
          this.contributors = [];
          return;
        }

        // Get the contributions array from the data
        // Both IdeaContributionsQuery and SolutionContributionsQuery have similar structure
        const contributions =
          this.contributionsPath === 'ideaContributions'
            ? (data as IdeaContributionsQuery).ideaContributions
            : (data as SolutionContributionsQuery).solutionContributions;

        if (!contributions || contributions.length === 0) {
          this.contributors = [];
          return;
        }

        // Use a Map to combine contributions from the same contributor
        const contributorMap = new Map<string, Contributor>();

        contributions.forEach((contribution) => {
          const funderId = contribution.funder.id;
          if (contributorMap.has(funderId)) {
            const existingContributor = contributorMap.get(funderId)!;
            const newContribution =
              BigInt(existingContributor.contribution) +
              BigInt(contribution.contribution);
            contributorMap.set(funderId, {
              ...existingContributor,
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
            contributorMap.set(funderId, {
              id: funderId,
              name,
              avatar,
              contribution: contribution.contribution,
            });
          }
        });

        // Convert map to array and sort by contribution amount (descending)
        this.contributors = Array.from(contributorMap.values()).sort((a, b) => {
          return BigInt(b.contribution) > BigInt(a.contribution) ? 1 : -1;
        });
      }
    );
  }

  /**
   * Creates query variables with the correct entity ID based on the entity type
   * @param entityId The ID of the entity (idea or solution)
   * @returns Query variables with the correct entity ID
   */
  private createQueryVariables(entityId: string): TVariables {
    const variables = {
      first: 5,
      skip: 0,
    };

    // Add the entity ID with the correct name based on the variable type
    if (this.entityIdVariableName === 'ideaId') {
      (variables as Partial<IdeaContributionsQueryVariables>).ideaId = entityId;
    } else if (this.entityIdVariableName === 'solutionId') {
      (variables as Partial<SolutionContributionsQueryVariables>).solutionId =
        entityId;
    }

    return variables as TVariables;
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('entityId')) {
      if (this.entityId) {
        const variables = this.createQueryVariables(this.entityId);
        this.contributorsController.setVariablesAndSubscribe(variables);
      } else {
        this.contributors = [];
      }
    }
  }

  render() {
    return html`
      <div>
        <h2>${this.titleText}</h2>
        ${this.contributors === undefined
          ? html` <sl-spinner></sl-spinner>`
          : this.contributors.length === 0
            ? html` <div class="no-contributors">
                ${this.noContributorsText}
              </div>`
            : cache(html`
                <div class="contributors-list">
                  ${this.contributors.map(
                    (contributor) => html`
                      <div class="contributor">
                        <user-avatar
                          .image=${contributor.avatar}
                          .address=${contributor.id}
                        ></user-avatar>
                        <div class="contributor-info">
                          <a
                            href="/profile/${contributor.id}"
                            class="contributor-name"
                            >${contributor.name}</a
                          >
                          <div class="contributor-contribution">
                            ${shortNum(
                              formatUnits(BigInt(contributor.contribution), 18)
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
