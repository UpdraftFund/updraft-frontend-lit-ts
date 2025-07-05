import { LitElement, html, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { cache } from 'lit/directives/cache.js';
import { SignalWatcher } from '@lit-labs/signals';

import '@components/common/section-heading';
import '@components/idea/idea-card-small';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';

import { UrqlQueryController } from '@utils/urql-query-controller';
import { IdeasByFunderOrCreatorDocument, Idea } from '@gql';

@customElement('my-ideas')
export class MyIdeas extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    sl-button::part(base) {
      font-weight: 500;
      margin-left: 0.75rem;
      width: fit-content;
    }

    .content {
      padding: 0;
    }

    idea-card-small {
      width: 100%;
    }

    .empty-message {
      padding: 0 1rem 1rem;
      color: var(--no-results);
      font-size: var(--sl-font-size-small);
      font-style: italic;
    }

    .load-more-container {
      display: flex;
      padding: 1rem 0;
    }
  `;

  @property({ type: String }) address: string | null = null;
  @state() private ideas: Idea[] = [];
  @state() private loading = true;
  @state() private currentSkip = 0;
  @state() private hasMoreResults = true;
  @state() private isLoadingMore = false;

  private readonly PAGE_SIZE = 3;

  // Controller for fetching ideas
  private readonly ideasController = new UrqlQueryController(
    this,
    IdeasByFunderOrCreatorDocument,
    {
      user: this.address || '',
      first: this.PAGE_SIZE,
      skip: this.currentSkip,
    },
    (result) => {
      this.loading = false;
      this.isLoadingMore = false;

      if (result.error) {
        console.error('Error fetching ideas:', result.error);
        if (this.currentSkip === 0) {
          this.ideas = [];
        }
        return;
      }

      if (result.data) {
        // Create a map to store ideas with their activity timestamps
        const ideaActivityMap = new Map();

        const fundedIdeas = result.data.fundedIdeas || [];
        fundedIdeas.forEach((contribution) => {
          const idea = contribution.idea;
          // Store the idea with its activity time (contribution time)
          ideaActivityMap.set(idea.id, {
            idea,
            // Use the latest activity time if this idea already exists in the map
            activityTime: Math.max(
              Number(contribution.createdTime) || Number(idea.startTime),
              ideaActivityMap.get(idea.id)?.activityTime || 0
            ),
          });
        });

        const createdIdeas = result.data.createdIdeas || [];
        createdIdeas.forEach((idea) => {
          // Store the idea with its activity time (creation time)
          ideaActivityMap.set(idea.id, {
            idea,
            // Use the latest activity time if this idea already exists in the map
            activityTime: Math.max(
              Number(idea.startTime),
              ideaActivityMap.get(idea.id)?.activityTime || 0
            ),
          });
        });

        // Sort ideas by activity time (newest first) and extract just the ideas
        const newIdeas = Array.from(ideaActivityMap.values())
          .sort((a, b) => b.activityTime - a.activityTime)
          .map((item) => item.idea);

        // Check if we have fewer results than requested, indicating no more results
        const totalNewResults = fundedIdeas.length + createdIdeas.length;
        this.hasMoreResults = totalNewResults >= this.PAGE_SIZE;

        if (this.currentSkip === 0) {
          // First page - replace existing ideas
          this.ideas = newIdeas;
        } else {
          // Pagination - append new ideas, avoiding duplicates
          const existingIds = new Set(this.ideas.map((idea) => idea.id));
          const uniqueNewIdeas = newIdeas.filter(
            (idea) => !existingIds.has(idea.id)
          );
          this.ideas = [...this.ideas, ...uniqueNewIdeas];
        }
      } else {
        if (this.currentSkip === 0) {
          this.ideas = [];
        }
      }
    }
  );

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    if (changedProperties.has('address') && this.address) {
      this.loading = true;
      this.currentSkip = 0;
      this.hasMoreResults = true;
      this.ideasController.setVariablesAndSubscribe({
        user: this.address,
        first: this.PAGE_SIZE,
        skip: this.currentSkip,
      });
    }
  }

  private loadMore() {
    if (!this.hasMoreResults || this.isLoadingMore || !this.address) return;

    this.isLoadingMore = true;
    this.currentSkip += this.PAGE_SIZE;

    this.ideasController.setVariablesAndSubscribe({
      user: this.address,
      first: this.PAGE_SIZE,
      skip: this.currentSkip,
    });
  }

  private renderLoadMoreButton() {
    if (!this.hasMoreResults) {
      return html``;
    }

    return html`
      <div class="load-more-container">
        <sl-button
          size="small"
          pill
          ?loading=${this.isLoadingMore}
          @click=${this.loadMore}
        >
          ${this.isLoadingMore ? 'Loading...' : 'Load more ideas...'}
        </sl-button>
      </div>
    `;
  }

  render() {
    return html`
      <section-heading>💡 My Ideas</section-heading>
      <sl-button size="small" pill href="/create-idea">
        Create an Idea
      </sl-button>
      <div class="content">
        ${this.loading
          ? html` <sl-spinner></sl-spinner>`
          : this.ideas.length === 0
            ? html`<div class="empty-message">
                You haven't supported or created any ideas yet.
              </div>`
            : html`
                ${cache(
                  this.ideas.map(
                    (idea) => html`
                      <idea-card-small
                        .idea=${idea}
                        .showReward=${false}
                      ></idea-card-small>
                    `
                  )
                )}
                ${this.renderLoadMoreButton()}
              `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-ideas': MyIdeas;
  }
}
