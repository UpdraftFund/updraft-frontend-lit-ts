import { LitElement, html, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { cache } from 'lit/directives/cache.js';
import { SignalWatcher } from '@lit-labs/signals';

import '@components/common/section-heading';
import '@components/idea/idea-card-small';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

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
  `;

  @property({ type: String }) address: string | null = null;
  @state() private ideas: Idea[] = [];
  @state() private loading = true;

  // Controller for fetching ideas
  private readonly ideasController = new UrqlQueryController(
    this,
    IdeasByFunderOrCreatorDocument,
    { user: this.address || '' },
    (result) => {
      this.loading = false;

      if (result.error) {
        console.error('Error fetching ideas:', result.error);
        this.ideas = [];
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

        // Sort ideas by activity time (newest first), extract just the ideas, and limit to 3
        this.ideas = Array.from(ideaActivityMap.values())
          .sort((a, b) => b.activityTime - a.activityTime)
          .map((item) => item.idea)
          .slice(0, 3); // Limit to 3 ideas total
      } else {
        this.ideas = [];
      }
    }
  );

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    if (changedProperties.has('address') && this.address) {
      this.loading = true;
      this.ideasController.setVariablesAndSubscribe({ user: this.address });
    }
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
            : cache(
                this.ideas.map(
                  (idea) => html`
                    <idea-card-small
                      .idea=${idea}
                      .showReward=${false}
                    ></idea-card-small>
                  `
                )
              )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-ideas': MyIdeas;
  }
}
