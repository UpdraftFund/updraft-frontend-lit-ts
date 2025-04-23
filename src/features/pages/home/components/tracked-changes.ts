import { customElement, state } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { formatUnits } from 'viem';

import { TrackedChangesDocument, UserIdeasSolutionsDocument } from '@gql';
import urqlClient from '@utils/urql-client';
import { since, resetSince } from '@state/user/tracked-changes';
import { userAddress } from '@state/user';

import refreshIcon from '@icons/common/arrow-clockwise.svg';

import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';
import '@shoelace-style/shoelace/dist/components/badge/badge.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { shortNum } from '@utils/short-num';
import { updraftSettings } from '@state/common';

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

    .header-container {
      margin-top: 1.5rem;
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .header-container h2 {
      margin: -0.25rem 0 0 0;
    }

    sl-icon-button.refresh-button::part(base) {
      font-size: 1.5rem;
      padding: 0;
    }

    sl-spinner {
      font-size: 2rem;
    }
  `;

  @state() private loading = false;
  @state() private error: Error | null = null;
  @state() private changes: TrackedChange[] = [];
  @state() private ideaIds: string[] = [];
  @state() private solutionIds: string[] = [];

  private get hasChanges(): boolean {
    return this.changes.length > 0;
  }

  private get hasIds(): boolean {
    return this.ideaIds.length > 0 || this.solutionIds.length > 0;
  }

  private changesSubscription: { unsubscribe: () => void } | null = null;
  private ideasSolutionsSubscription: { unsubscribe: () => void } | null = null;

  // Track the current user address to detect changes
  private lastUserAddress: string | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.loadUserIdeasAndSolutions();
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.cleanup();
    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange
    );
  }

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.cleanup();
    } else {
      this.loadUserIdeasAndSolutions();
    }
  };

  private cleanup() {
    if (this.changesSubscription) {
      this.changesSubscription.unsubscribe();
      this.changesSubscription = null;
    }

    if (this.ideasSolutionsSubscription) {
      this.ideasSolutionsSubscription.unsubscribe();
      this.ideasSolutionsSubscription = null;
    }
  }

  private loadUserIdeasAndSolutions() {
    const currentUserAddress = userAddress.get();
    if (this.lastUserAddress !== currentUserAddress) {
      this.lastUserAddress = currentUserAddress;
      this.subscribeToUserIdeasSolutions(currentUserAddress);
    }
  }

  private subscribeToUserIdeasSolutions(address: string | null) {
    // Clean up previous subscription if it exists
    if (this.ideasSolutionsSubscription) {
      this.ideasSolutionsSubscription.unsubscribe();
      this.ideasSolutionsSubscription = null;
    }

    if (!address) {
      console.log('No user address found');
      this.loading = false;
      this.ideaIds = [];
      this.solutionIds = [];
      return;
    }

    this.loading = true;

    console.log('Subscribing to ideas and solutions for user:', address);

    this.ideasSolutionsSubscription = urqlClient
      .query(UserIdeasSolutionsDocument, {
        userId: address,
      })
      .subscribe((result) => {
        if (result.error) {
          console.error(
            'Error fetching user ideas and solutions:',
            result.error
          );
          this.ideaIds = [];
          this.solutionIds = [];
          this.setupSubscription();
          return;
        }

        // Extract idea IDs
        const extractedIdeaIds =
          result.data?.fundedIdeas?.map(
            (contribution) => contribution.idea.id
          ) || [];

        // Extract and combine solution IDs
        const createdSolutionIds =
          result.data?.createdSolutions?.map((solution) => solution.id) || [];
        const fundedSolutionIds =
          result.data?.fundedSolutions?.map(
            (contribution) => contribution.solution.id
          ) || [];

        const uniqueSolutionIds = [
          ...new Set([...createdSolutionIds, ...fundedSolutionIds]),
        ];

        console.log('User ideas:', extractedIdeaIds);
        console.log('User solutions:', uniqueSolutionIds);

        this.ideaIds = extractedIdeaIds;
        this.solutionIds = uniqueSolutionIds;

        // After getting the IDs, set up the changes subscription
        this.setupSubscription();
      });
  }

  private setupSubscription() {
    // Clean up any existing subscription
    if (this.changesSubscription) {
      this.changesSubscription.unsubscribe();
      this.changesSubscription = null;
    }

    if (this.ideaIds.length || this.solutionIds.length) {
      this.loading = true;
      this.error = null;

      // Subscribe to tracked changes
      this.changesSubscription = urqlClient
        .query(TrackedChangesDocument, {
          ideaIds: this.ideaIds,
          solutionIds: this.solutionIds,
          since: since.get(),
        })
        .subscribe((result) => {
          this.loading = false;
          console.log('Tracked changes query result:', result);

          if (result.error) {
            this.error = new Error(result.error.message);
            return;
          }

          if (result.data) {
            const allChanges: TrackedChange[] = [
              // New supporters for ideas you created or funded
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
            this.changes = uniqueChanges;
          }
        });
    } else {
      this.loading = false;
    }
  }

  private handleRefresh() {
    resetSince();
    this.loadUserIdeasAndSolutions();
  }

  private formatAmount(
    amount: string | null | undefined,
    decimals: number = 18
  ): string {
    if (!amount) return '0';
    return shortNum(formatUnits(BigInt(amount), decimals));
  }

  private formatReward(percentage: string | null | undefined): string {
    if (!percentage) return '0';
    return (
      (Number(percentage) * 100) /
      updraftSettings.get().percentScale
    ).toString();
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
        return html``;
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
    if (!solution) return html``;

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
          : html``}
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
          ><span class="emoji">🎁</span> ${this.formatReward(
            solution.funderReward
          )}%</span
        >
      </div>
    `;
  }

  private renderChanges() {
    if (this.error) {
      return html`
        <sl-alert variant="danger" open>
          <strong>Error loading changes:</strong>
          ${this.error.message}
        </sl-alert>
      `;
    }

    if (!this.hasChanges) {
      return html`
        <div class="empty-state">No recent changes to display.</div>
      `;
    }

    return html`
      ${this.changes.map(
        (change) => html`
          <sl-card>
            <div slot="header">${this.getChangeTitle(change)}</div>
            ${change.solution
              ? this.renderSolutionDetails(change.solution)
              : html``}
          </sl-card>
        `
      )}
    `;
  }

  render() {
    // Always check for new user address changes
    this.loadUserIdeasAndSolutions();

    return html`
      <div class="header-container">
        <h2>Updates</h2>
        ${this.hasIds && !this.loading
          ? html`
              <sl-icon-button
                class="refresh-button"
                src=${refreshIcon}
                label="Refresh updates"
                @click=${this.handleRefresh}
              ></sl-icon-button>
            `
          : html``}
      </div>
      ${this.loading ? html` <sl-spinner></sl-spinner> ` : html``}
      ${this.renderChanges()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tracked-changes': TrackedChanges;
  }
}
