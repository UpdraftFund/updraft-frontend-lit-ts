import { customElement, state } from 'lit/decorators.js';
import { css, LitElement } from 'lit';
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
import urqlClient from '@utils/urql-client';
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
      animation: rotate 1.5s ease-in-out;
    }

    sl-spinner {
      font-size: 2rem;
    }
  `;

  @state() private loading = false;
  @state() private error: Error | null = null;
  @state() private ideaIds: string[] = [];
  @state() private solutionIds: string[] = [];
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

  private trackedChangesSub: { unsubscribe: () => void } | null = null;
  private changesFromIdsSub: { unsubscribe: () => void } | null = null;

  // Track the current user address to detect changes
  private lastUserAddress: string | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.checkForAddressChange();
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
      this.checkForAddressChange();
    }
  };

  private cleanup() {
    if (this.changesFromIdsSub) {
      this.changesFromIdsSub.unsubscribe();
      this.changesFromIdsSub = null;
    }

    if (this.trackedChangesSub) {
      this.trackedChangesSub.unsubscribe();
      this.trackedChangesSub = null;
    }
  }

  private checkForAddressChange() {
    const currentUserAddress = userAddress.get();
    if (this.lastUserAddress !== currentUserAddress) {
      this.lastUserAddress = currentUserAddress;
      this.subToTrackedChanges(currentUserAddress);
    }
  }

  private subToTrackedChanges(address: string | null) {
    // Clean up previous subscription if it exists
    if (this.trackedChangesSub) {
      this.trackedChangesSub.unsubscribe();
      this.trackedChangesSub = null;
    }

    if (!address) {
      console.log('No user address found');
      this.loading = false;
      this.ideaIds = [];
      this.solutionIds = [];
      this.changesManager.clear();
      return;
    }

    this.loading = true;

    console.log('Subscribing to ideas and solutions for user:', address);

    this.trackedChangesSub = urqlClient
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
          this.subToChangesFromIds();
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

        this.subToChangesFromIds();
      });
  }

  private subToChangesFromIds() {
    // Clear existing changes
    this.changesManager.clear();

    // Clean up any existing subscription
    if (this.changesFromIdsSub) {
      this.changesFromIdsSub.unsubscribe();
      this.changesFromIdsSub = null;
    }

    if (this.ideaIds.length || this.solutionIds.length) {
      this.loading = true;
      this.error = null;

      // Subscribe to tracked changes
      this.changesFromIdsSub = urqlClient
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
              else if (
                now.isAfter(deadlineDate) &&
                progressBigInt < goalBigInt
              ) {
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
        });
    } else {
      this.loading = false;
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

    this.subToTrackedChanges(userAddress.get());
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

  render() {
    this.checkForAddressChange();
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
      ${this.renderTrackedChanges()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tracked-changes': TrackedChanges;
  }
}
