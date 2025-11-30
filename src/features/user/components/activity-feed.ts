import { customElement, property, state } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';
import { cache } from 'lit/directives/cache.js';

import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';

import '@/features/user/components/activity-card';

import { UserActivityDocument } from '@gql';
import { UrqlQueryController } from '@utils/urql-query-controller';
import { Activity } from '@/features/user/types';

@customElement('activity-feed')
export class ActivityFeed extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding-right: 1rem;
    }

    .activity-heading {
      line-height: 1.4;
      color: var(--sl-color-neutral-900);
      margin: 0;
      text-align: center;
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
      color: var(--subtle-text);
    }

    .empty-state {
      padding: 1rem;
      color: var(--no-results);
      font-style: italic;
    }
  `;

  @property() userId!: `0x${string}`;
  @property() userName!: string;
  @state() private activities: Activity[] = [];
  @state() private isLoading = true;
  @state() private error: Error | null = null;

  private readonly activityController = new UrqlQueryController(
    this,
    UserActivityDocument,
    { userId: this.userId, first: 5 },
    (result) => {
      this.isLoading = false;

      if (result.error) {
        this.error = result.error;
        return;
      }

      if (result.data) {
        const allActivities = [
          ...result.data.ideasCreated.map((item) => ({
            ...item,
            type: 'ideaCreated',
            timestamp: item.startTime * 1000,
          })),
          ...result.data.ideasFunded.map((item) => ({
            ...item,
            type: 'ideaFunded',
            timestamp: item.createdTime * 1000 || item.idea.startTime * 1000,
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
        this.activities = allActivities as Activity[];
      } else {
        this.activities = [];
      }
    }
  );

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('userId') && this.userId) {
      this.isLoading = true;
      this.error = null;
      this.activityController.setVariablesAndSubscribe({
        userId: this.userId,
        first: 10,
      });
    }
  }

  render() {
    return html`
      <h2 class="activity-heading">📈 Activity</h2>

      ${this.isLoading
        ? html`
            <div class="loading-container">
              <sl-spinner style="font-size: 2rem;"></sl-spinner>
              <div>Loading activities...</div>
            </div>
          `
        : this.error
          ? html`
              <sl-alert variant="danger" open>
                <strong>Error loading activities:</strong>
                ${this.error.message || 'Unknown error'}
              </sl-alert>
            `
          : this.activities.length === 0
            ? html` <div class="empty-state">No activities found for this user.</div> `
            : html`
                <div class="activity-list">
                  ${cache(
                    this.activities.map(
                      (activity) => html`
                        <activity-card
                          .activity=${activity}
                          .userId=${this.userId}
                          .userName=${this.userName}
                 ,       ></activity-c,ard>
                      `
                    )
                  )}
                </div>
              `}
    `;
  }
}
