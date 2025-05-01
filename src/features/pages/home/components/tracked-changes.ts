import { customElement, state } from 'lit/decorators.js';
import { css, LitElement } from 'lit';
import { cache } from 'lit/directives/cache.js';
import { html, SignalWatcher } from '@lit-labs/signals';
import dayjs from 'dayjs';

import refreshIcon from '@icons/common/arrow-clockwise.svg';

import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';
import '@shoelace-style/shoelace/dist/components/badge/badge.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';

import './new-supporters-card';
import './new-solution-card';
import './new-funders-card';
import './solution-updated-card';
import './goal-reached-card';
import './goal-failed-card';

import { TrackedChangesDocument, UserIdeasSolutionsDocument } from '@gql';
import { UrqlQueryController } from '@/features/common/utils/urql-query-controller';
import { TrackedChangesManager } from '@utils/home/tracked-changes-manager';

import { since } from '@state/user/tracked-changes';
import { userAddress } from '@state/user';

@customElement('tracked-changes')
export class TrackedChanges extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
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
      color: var(--main-foreground);
      padding: 0;
    }

    @keyframes rotate {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    .rotating {
      animation: rotate 1s ease-in-out;
    }

    sl-spinner {
      font-size: 2rem;
    }
  `;

  @state() private loading = false;
  @state() private error: Error | null = null;
  @state() private ideaIds: `0x${string}`[] = [];
  @state() private solutionIds: `0x${string}`[] = [];
  @state() private isRefreshing = false;
  @state() private target: number = 10;

  // Use our new data structure
  private changesManager = new TrackedChangesManager(this.target);

  private get hasChanges(): boolean {
    return this.changesManager.size() > 0;
  }

  private get hasIds(): boolean {
    return this.ideaIds.length > 0 || this.solutionIds.length > 0;
  }

  // Track the current user address to detect changes
  private lastAddress: string | null = null;

  // Controller for fetching user ideas and solutions
  private readonly userIdeasSolutionsController = new UrqlQueryController(
    this,
    UserIdeasSolutionsDocument,
    { userId: userAddress.get() || '' },
    (result) => {
      if (result.error) {
        console.error('Error fetching user ideas and solutions:', result.error);
        this.ideaIds = [];
        this.solutionIds = [];
        this.loading = false;
        this.changesManager.clear();
        return;
      }

      if (result.data) {
        // Extract idea IDs
        const extractedIdeaIds =
          result.data.fundedIdeas?.map(
            (contribution) => contribution.idea.id
          ) || [];

        // Extract and combine solution IDs
        const createdSolutionIds =
          result.data.createdSolutions?.map((solution) => solution.id) || [];
        const fundedSolutionIds =
          result.data.fundedSolutions?.map(
            (contribution) => contribution.solution.id
          ) || [];

        const uniqueSolutionIds = [
          ...new Set([...createdSolutionIds, ...fundedSolutionIds]),
        ];

        console.log('User ideas:', extractedIdeaIds);
        console.log('User solutions:', uniqueSolutionIds);

        this.ideaIds = extractedIdeaIds;
        this.solutionIds = uniqueSolutionIds;

        this.fetchTrackedChanges();
      }
    }
  );

  // Controller for fetching tracked changes
  private readonly trackedChangesController = new UrqlQueryController(
    this,
    TrackedChangesDocument,
    {
      ideaIds: [] as `0x${string}`[],
      solutionIds: [] as `0x${string}`[],
      since: since.get(),
    },
    (result) => {
      this.loading = false;
      console.log('Tracked changes query result:', result);

      if (result.error) {
        this.error = new Error(result.error.message);
        return;
      }

      if (result.data) {
        // Clear existing changes before processing new ones
        this.changesManager.clear();

        // Process new supporters for ideas you funded
        result.data.newSupporters.forEach((item) => {
          this.changesManager.addChange({
            type: 'newSupporter',
            time: Number(item.createdTime) * 1000,
            idea: item.idea,
            supporters: [
              {
                id: item.funder.id,
                profile: item.funder.profile,
              },
            ],
          });
        });

        // Process new solutions for your ideas
        result.data.newSolutions.forEach((item) => {
          this.changesManager.addChange({
            type: 'newSolution',
            time: Number(item.startTime) * 1000,
            solution: item,
          });
        });

        // Process updates to solutions you created or funded
        result.data.solutionUpdated.forEach((item) => {
          const now = dayjs();
          const deadlineDate = dayjs(Number(item.deadline) * 1000);
          const progressBigInt = BigInt(item.tokensContributed || '0');
          const goalBigInt = BigInt(item.fundingGoal || '0');

          // Check if the goal was reached
          if (goalBigInt > 0n && progressBigInt >= goalBigInt) {
            this.changesManager.addChange({
              type: 'goalReached',
              time: Number(item.startTime) * 1000,
              solution: item,
            });
          }
          // Check if the deadline has passed and goal wasn't reached
          else if (now.isAfter(deadlineDate) && progressBigInt < goalBigInt) {
            this.changesManager.addChange({
              type: 'goalFailed',
              time: Number(item.startTime) * 1000,
              solution: item,
            });
          }
          // Otherwise it's just a regular update
          else {
            this.changesManager.addChange({
              type: 'solutionUpdated',
              time: Number(item.startTime) * 1000,
              solution: item,
            });
          }
        });

        // Process new funders for solutions you created or funded
        result.data.newFunders.forEach((item) => {
          this.changesManager.addChange({
            type: 'newFunder',
            time: Number(item.createdTime) * 1000,
            solution: item.solution,
            funders: [
              {
                id: item.funder?.id || '',
                profile: item.funder.profile,
              },
            ],
          });
        });
      }
    }
  );

  // Method to fetch tracked changes based on current ideaIds and solutionIds
  private fetchTrackedChanges() {
    if (this.ideaIds.length || this.solutionIds.length) {
      this.loading = true;
      this.error = null;

      this.trackedChangesController.setVariablesAndSubscribe({
        ideaIds: this.ideaIds,
        solutionIds: this.solutionIds,
        since: since.get(),
      });
    } else {
      this.loading = false;
      this.changesManager.clear();
    }
  }

  // Check for address changes and update the controller variables
  private checkForAddressChangeAndSubscribe() {
    const currentUserAddress = userAddress.get();
    if (this.lastAddress !== currentUserAddress) {
      this.lastAddress = currentUserAddress;

      if (currentUserAddress) {
        this.loading = true;
        this.userIdeasSolutionsController.setVariablesAndSubscribe({
          userId: currentUserAddress,
        });
      } else {
        this.loading = false;
        this.ideaIds = [];
        this.solutionIds = [];
        this.changesManager.clear();
      }
    }
  }

  private handleRefresh() {
    const button = this.shadowRoot?.querySelector('.refresh-button');
    if (button) {
      button.classList.add('rotating');
      this.isRefreshing = true;

      // Remove the class after animation completes
      setTimeout(() => {
        button.classList.remove('rotating');
        this.isRefreshing = false;
      }, 5 * 1000);
    }

    // Refresh both controllers
    this.userIdeasSolutionsController.refresh();
    this.trackedChangesController.refresh();
  }

  private renderTrackedChanges() {
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

    const changesToRender = this.changesManager.getChangesForRendering();

    return html`
      ${changesToRender.map((change) => {
        switch (change.type) {
          case 'newSupporter':
            return html` <new-supporters-card
              .change=${change}
            ></new-supporters-card>`;
          case 'newSolution':
            return html` <new-solution-card
              .change=${change}
            ></new-solution-card>`;
          case 'solutionUpdated':
            return html` <solution-updated-card
              .change=${change}
            ></solution-updated-card>`;
          case 'newFunder':
            return html` <new-funders-card
              .change=${change}
            ></new-funders-card>`;
          case 'goalReached':
            return html` <goal-reached-card
              .change=${change}
            ></goal-reached-card>`;
          case 'goalFailed':
            return html` <goal-failed-card
              .change=${change}
            ></goal-failed-card>`;
          default:
            return html``;
        }
      })}
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    // The UrqlQueryController handles visibility changes automatically
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // The UrqlQueryController handles cleanup automatically
  }

  render() {
    this.checkForAddressChangeAndSubscribe();
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
                ?disabled=${this.isRefreshing}
              ></sl-icon-button>
            `
          : html``}
      </div>
      ${this.loading ? html` <sl-spinner></sl-spinner> ` : html``}
      ${cache(this.renderTrackedChanges())}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tracked-changes': TrackedChanges;
  }
}
