import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { cache } from 'lit/directives/cache.js';
import { SignalWatcher } from '@lit-labs/signals';

import '@components/common/section-heading';
import '@components/idea/idea-card-small';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

import { userAddress } from '@state/user';

import { UrqlQueryController } from '@utils/urql-query-controller';
import { IdeasByFunderOrCreatorDocument, Idea } from '@gql';

@customElement('my-ideas')
export class MyIdeas extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      display: block;
    }

    .content {
      padding: 1rem 0 0;
      box-sizing: border-box;
    }

    idea-card-small {
      width: 100%;
    }
  `;

  @state() private ideas: Idea[] = [];
  @state() private loading = true;

  // Track the current user address to detect changes
  private lastAddress: string | null = null;

  // Controller for fetching ideas
  private readonly ideasController = new UrqlQueryController(
    this,
    IdeasByFunderOrCreatorDocument,
    { user: userAddress.get() || '' },
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

  private checkForAddressChangeAndSubscribe() {
    const currentAddress = userAddress.get();
    if (this.lastAddress !== currentAddress) {
      this.lastAddress = currentAddress;
      if (currentAddress) {
        this.loading = true;
        this.ideasController.setVariablesAndSubscribe({ user: currentAddress });
      }
    }
  }

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    this.checkForAddressChangeAndSubscribe();
  }

  render() {
    return html`
      <section-heading>My Ideas</section-heading>
      <div class="content">
        ${this.loading
          ? html` <sl-spinner></sl-spinner>`
          : cache(
              this.ideas.map(
                (idea) => html`
                  <idea-card-small .idea=${idea}></idea-card-small>
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
