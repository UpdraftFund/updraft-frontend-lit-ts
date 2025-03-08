import { customElement, property } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';
import { Task } from '@lit/task';

import { UserActivityDocument } from '@gql';
import urqlClient from '@/urql-client';
import '@components/page-specific/profile/activity-card';

// Import Shoelace components
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';

// Import the ActivityType from a shared types file in a real application
// For now, we'll define it here to match the one in activity-card.ts
type ActivityType = {
  type: 'ideaFunded' | 'solutionFunded' | 'solutionDrafted';
  contribution?: number;
  idea?: { 
    name: string; 
    creator: { id: string }; 
    description?: string | null;
  };
  solution?: { 
    name?: string; 
    description?: string | null;
  };
  name?: string;
  displayName?: string;
  description?: string | null;
  time: string;
  deadline?: string;
  fundingGoal?: string;
  tokensContributed?: string;
  stake?: string;
  funderReward?: string;
};

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
      padding: 1rem;
    }
    
    .activity-header {
      font-family: var(--sl-font-sans);
      font-weight: var(--sl-font-weight-bold);
      font-size: var(--sl-font-size-2x-large);
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
      text-align: center;
      padding: 2rem;
      color: var(--sl-color-neutral-600);
      font-style: italic;
    }
  `;

  @property() userId!: string;
  @property() userName!: string;
  private readonly activities = new Task(this, {
    task: async () => {
      const result = await urqlClient.query(UserActivityDocument, {
        userId: this.userId,
        first: 10, // Increase the number of items to fetch
      });
      
      if (result.data) {
        const allActivities = [
          ...result.data.ideasFunded.map((item) => ({
            type: 'ideaFunded',
            userName: this.userName,
            contribution: item.contribution,
            idea: {
              name: item.idea.name || 'Unnamed Idea',
              creator: { id: item.idea.creator.id },
              description: item.idea.description
            },
            time: item.idea.startTime,
            funderReward: item.idea.funderReward,
          })),
          ...result.data.solutionsFunded.map((item) => ({
            type: 'solutionFunded',
            contribution: item.contribution,
            solution: {
              description: item.solution.info
            },
            displayName: item.solution.id,
            time: item.solution.startTime,
            description: item.solution.info,
            deadline: item.solution.deadline,
            fundingGoal: item.solution.fundingGoal,
            tokensContributed: item.solution.tokensContributed,
            stake: item.solution.stake,
            funderReward: item.solution.funderReward,
          })),
          ...result.data.solutionsDrafted.map((item) => ({
            type: 'solutionDrafted',
            solution: {
              description: item.info
            },
            displayName: item.id,
            time: item.startTime,
            description: item.info,
            deadline: item.deadline,
            fundingGoal: item.fundingGoal,
            tokensContributed: item.tokensContributed,
            stake: item.stake,
            funderReward: item.funderReward,
          })),
        ];

        // Sort by time in descending order (newest first)
        allActivities.sort((a, b) => {
          const timeA = new Date(a.time).getTime();
          const timeB = new Date(b.time).getTime();
          return timeB - timeA;
        });

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
        <h2 class="activity-header">Activity</h2>
        
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
                    <activity-card .activity=${activity as any}></activity-card>
                  `
                )}
              </div>
            `;
          }
        })}
      </div>
    `;
  }
}
