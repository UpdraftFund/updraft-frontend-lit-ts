import { customElement, property } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';
import { Task } from '@lit/task';

import { UserActivityDocument } from '@gql';
import urqlClient from '@utils/urql-client';
import '@/features/user/components/activity-card';

// Import Shoelace components
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';

@customElement('activity-feed')
export class ActivityFeed extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .activity-feed {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      width: 100%;
      max-width: 782px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .activity-heading {
      line-height: 1.4;
      color: var(--sl-color-neutral-900);
      margin: 0;
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      width: 100%;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      gap: 1rem;
      color: var(--sl-color-neutral-600);
    }

    .empty-state {
      padding: 1rem;
      color: var(--sl-color-neutral-600);
      font-style: italic;
    }
  `;

  @property() userId!: `0x${string}`;
  @property() userName!: string;
  private readonly activities = new Task(this, {
    task: async () => {
      const result = await urqlClient.query(UserActivityDocument, {
        userId: this.userId,
        first: 10,
      });

      if (result.data) {
        const allActivities = [
          ...result.data.ideasFunded.map((item) => ({
            ...item,
            type: 'ideaFunded',
            timestamp: item.createdTime * 1000,
          })),
          ...result.data.solutionsFunded.map((item) => ({
            ...item,
            type: 'solutionFunded',
            timestamp: item.createdTime * 1000,
          })),
          ...result.data.solutionsDrafted.map((item) => ({
            ...item,
            type: 'solutionDrafted',
            timestamp: item.startTime * 1000,
          })),
        ];

        // Sort by time in descending order (newest first)
        allActivities.sort((a, b) => b.timestamp - a.timestamp);
        return allActivities;
      }
      return [];
    },
    // Re-run when userId changes
    args: () => [this.userId],
  });

  render() {
    return html`
      <div class="activity-feed">
        <h2 class="activity-heading">Activity</h2>

        ${this.activities.render({
          pending: () => html`
            <div class="loading-container">
              <sl-spinner style="font-size: 2rem;"></sl-spinner>
              <div>Loading activities...</div>
            </div>
          `,
          error: (error) => html`
            <sl-alert variant="danger" open>
              <strong>Error loading activities:</strong>
              ${error instanceof Error ? error.message : 'Unknown error'}
            </sl-alert>
          `,
          complete: (activities) => {
            if (!activities || activities.length === 0) {
              return html`
                <div class="empty-state">
                  No activities found for this user.
                </div>
              `;
            }

            return html`
              <div class="activity-list">
                ${activities.map(
                  (activity) => html`
                    <activity-card
                      .activity=${activity}
                      .userId=${this.userId}
                      .userName=${this.userName}
                    ></activity-card>
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
