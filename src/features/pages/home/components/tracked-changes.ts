import { customElement, property } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';
import { Task } from '@lit/task';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { formatUnits } from 'viem';

import { TrackedChangesDocument } from '@gql';
import urqlClient from '@utils/urql-client';

import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';
import '@shoelace-style/shoelace/dist/components/badge/badge.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

dayjs.extend(relativeTime);

// Define types for our tracked changes
interface User {
  id: string;
  profile?: string | null;
}

interface Idea {
  id: string;
  name?: string | null;
  creator?: User;
}

interface Solution {
  id: string;
  startTime: number;
  deadline: number;
  tokensContributed?: string | null;
  fundingGoal?: string | null;
  stake?: string | null;
  info?: string | null;
  funderReward?: string | null;
}

interface TrackedChange {
  type: 'newSupporter' | 'newSolution' | 'solutionUpdated' | 'newFunder';
  time: number;
  idea?: Idea;
  solution?: Solution;
  funder?: User;
  contribution?: string;
}

@customElement('tracked-changes')
export class TrackedChanges extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    sl-card {
      --padding: 1rem;
    }

    .change-card-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;
    }

    .change-card-byline {
      font-size: 0.875rem;
      color: var(--sl-color-neutral-600);
    }

    .change-card-supporters {
      font-size: 1rem;
      color: var(--sl-color-neutral-700);
    }

    .change-details {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .goal {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 150px;
    }

    .goal-text {
      font-size: 0.75rem;
      color: var(--sl-color-neutral-600);
    }

    .emoji-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.875rem;
    }

    .emoji {
      font-size: 1rem;
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
      color: var(--subtle-text);
      font-style: italic;
    }
  `;

  @property() ideaIds: string[] = [];
  @property() solutionIds: string[] = [];

  private readonly changes = new Task(this, {
    task: async () => {
      // Get changes from the last 24 hours
      const oneDayAgo = Math.floor(Date.now() / 1000) - 86400;

      console.log('Fetching tracked changes with:', {
        ideaIds: this.ideaIds,
        solutionIds: this.solutionIds,
        since: oneDayAgo,
      });

      const result = await urqlClient.query(TrackedChangesDocument, {
        ideaIds: this.ideaIds,
        solutionIds: this.solutionIds,
        since: oneDayAgo,
      });

      console.log('Tracked changes query result:', result);

      if (result.data) {
        const allChanges: TrackedChange[] = [
          // New supporters for ideas you created
          ...result.data.newSupporters.map((item) => ({
            type: 'newSupporter' as const,
            time: Number(item.createdTime),
            idea: item.idea,
            funder: item.funder,
            contribution: item.contribution,
          })),
          // New solutions for your ideas
          ...result.data.newSolutions.map((item) => ({
            type: 'newSolution' as const,
            time: Number(item.startTime),
            idea: item.idea,
            solution: item,
          })),
          // Updates to solutions you created or funded
          ...result.data.solutionUpdated.map((item) => ({
            type: 'solutionUpdated' as const,
            time: Number(item.startTime),
            solution: item,
          })),
          // New funders for solutions you created or funded
          ...result.data.newFunders.map((item) => ({
            type: 'newFunder' as const,
            time: Number(item.createdTime),
            solution: item.solution,
            funder: item.funder,
            contribution: item.contribution,
          })),
        ];

        // Remove duplicates based on type, time, and relevant IDs
        const uniqueChanges = allChanges.filter((change, index, self) => {
          const isDuplicate = self.findIndex((c) => {
            if (c.type !== change.type) return false;
            if (c.time !== change.time) return false;

            switch (c.type) {
              case 'newSupporter':
                return (
                  c.idea?.id === change.idea?.id &&
                  c.funder?.id === change.funder?.id
                );
              case 'newSolution':
                return (
                  c.idea?.id === change.idea?.id &&
                  c.solution?.id === change.solution?.id
                );
              case 'solutionUpdated':
                return c.solution?.id === change.solution?.id;
              case 'newFunder':
                return (
                  c.solution?.id === change.solution?.id &&
                  c.funder?.id === change.funder?.id
                );
              default:
                return false;
            }
          });
          return isDuplicate === index;
        });

        // Sort by time in descending order (newest first)
        uniqueChanges.sort((a, b) => b.time - a.time);

        console.log('Processed changes:', uniqueChanges);
        return uniqueChanges;
      }

      return [];
    },
    args: () => [this.ideaIds, this.solutionIds],
  });

  private formatAmount(
    amount: string | null | undefined,
    decimals: number = 18
  ): string {
    if (!amount) return '0';
    return Number(formatUnits(BigInt(amount), decimals)).toLocaleString();
  }

  private formatReward(percentage: string | null | undefined): string {
    if (!percentage) return '0';
    return (Number(percentage) / 10000).toString();
  }

  private getChangeTitle(change: TrackedChange) {
    switch (change.type) {
      case 'newSupporter':
        return html`
          <h3 class="change-card-title">${change.idea?.name}</h3>
          <div class="change-card-byline">
            ${change.funder?.id} supported with
            ${this.formatAmount(change.contribution)} UPD
          </div>
        `;
      case 'newSolution':
        return html`
          <h3 class="change-card-title">${change.idea?.name}</h3>
          <div class="change-card-byline">
            New solution by ${change.solution?.id}
          </div>
        `;
      case 'solutionUpdated':
        return html`
          <h3 class="change-card-title">Solution Updated</h3>
          <div class="change-card-byline">by ${change.solution?.id}</div>
        `;
      case 'newFunder':
        return html`
          <h3 class="change-card-title">${change.solution?.info}</h3>
          <div class="change-card-byline">
            ${change.funder?.id} funded with
            ${this.formatAmount(change.contribution)} UPD
          </div>
        `;
      default:
        return '';
    }
  }

  private calculateProgress(solution: TrackedChange['solution']) {
    if (!solution?.tokensContributed || !solution?.fundingGoal) {
      return 0;
    }

    const contributed = Number(
      formatUnits(BigInt(solution.tokensContributed), 18)
    );
    const goal = Number(formatUnits(BigInt(solution.fundingGoal), 18));

    if (isNaN(contributed) || isNaN(goal) || goal === 0) {
      return 0;
    }

    return (contributed / goal) * 100;
  }

  private renderSolutionDetails(solution: TrackedChange['solution']) {
    if (!solution) return '';

    const progress = this.calculateProgress(solution);
    const isCompleted = progress >= 100;
    const deadline = dayjs(solution.deadline * 1000);
    const now = dayjs();

    return html`
      <sl-divider></sl-divider>
      <div class="change-details">
        <div class="goal">
          <sl-progress-bar value="${Math.min(progress, 100)}"></sl-progress-bar>
          <div class="goal-text">
            ${this.formatAmount(solution.tokensContributed)} out of
            ${this.formatAmount(solution.fundingGoal)} UPD
          </div>
        </div>
        ${isCompleted
          ? html`
              <sl-badge variant="success" pill>
                <span class="emoji">🥳</span> Funded
              </sl-badge>
            `
          : ''}
        <span class="emoji-badge"
          ><span class="emoji">⏰</span> ${deadline.isBefore(now)
            ? 'expired'
            : deadline.fromNow()}</span
        >
        <span class="emoji-badge"
          ><span class="emoji">💎</span> ${this.formatAmount(
            solution.stake
          )}</span
        >
        <span class="emoji-badge"
          ><span class="emoji">💰</span> ${this.formatReward(
            solution.funderReward
          )}%</span
        >
      </div>
    `;
  }

  render() {
    return html`
      <h2>Updates</h2>
      ${this.changes.render({
        pending: () => html`
          <div class="loading-container">
            <sl-spinner style="font-size: 2rem;"></sl-spinner>
            <div>Loading changes...</div>
          </div>
        `,
        error: (error) => html`
          <sl-alert variant="danger" open>
            <strong>Error loading changes:</strong>
            ${error instanceof Error ? error.message : 'Unknown error'}
          </sl-alert>
        `,
        complete: (changes) => {
          if (!changes || changes.length === 0) {
            return html`
              <div class="empty-state">No recent changes to display.</div>
            `;
          }

          return html`
            ${changes.map(
              (change) => html`
                <sl-card>
                  <div slot="header">${this.getChangeTitle(change)}</div>
                  ${change.solution
                    ? this.renderSolutionDetails(change.solution)
                    : ''}
                </sl-card>
              `
            )}
          `;
        },
      })}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tracked-changes': TrackedChanges;
  }
}
