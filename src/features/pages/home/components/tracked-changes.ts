import { customElement, state, query } from 'lit/decorators.js';
import { css, LitElement } from 'lit';
import { cache } from 'lit/directives/cache.js';
import { html, SignalWatcher } from '@lit-labs/signals';
import dayjs from 'dayjs';

// Icons
import refreshIcon from '@icons/arrow-clockwise.svg';

// Shoelace components
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';
import '@shoelace-style/shoelace/dist/components/badge/badge.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';

// Components
import './new-supporters-card';
import './new-solution-card';
import './new-funders-card';
import './solution-updated-card';
import './goal-reached-card';
import './goal-failed-card';

// GraphQL
import {
  Solution,
  TrackedChangesDocument,
  UserIdeasSolutionsDocument,
} from '@gql';

// Utils
import { UrqlQueryController } from '@utils/urql-query-controller';
import { TrackedChangesManager } from '@utils/home/tracked-changes-manager';
import { goalFailed, goalReached } from '@utils/solution/solution-utils';

// State
import { since } from '@state/user/tracked-changes';
import { userAddress } from '@state/user';

@customElement('tracked-changes')
export class TrackedChanges extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .empty-state {
      text-align: center;
      color: var(--no-results);
      font-style: italic;
    }

    .header-container {
      margin: 1.5rem 0 1rem;
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

    .full-width {
      width: 100%;
      flex-basis: 100%;
    }

    /* Cards container styling */
    .cards-container {
      display: flex;
      flex-wrap: wrap;
      gap: 1.25rem;
      width: 100%;
    }

    /* Card components styling */
    .cards-container > * {
      flex: 1 0 280px;
      max-width: 100%;
      /* Ensure cards don't disappear on narrow screens */
      min-width: 0;
    }

    /* Media query for mobile devices */
    @media (max-width: 600px) {
      .cards-container > * {
        flex-basis: 100%;
      }
    }
  `;

  @state() private loading = false;
  @state() private error: Error | null = null;
  @state() private ideaIds: `0x${string}`[] = [];
  @state() private solutionIds: `0x${string}`[] = [];
  @state() private isRefreshing = false;
  @state() private target: number = 10;

  @query('.refresh-button', true) private refreshButton!: HTMLElement;

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
      now: dayjs().unix(),
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
        result.data.solutionUpdated
          // Filter out updates triggered by solution creation
          .filter((solution) => solution.startTime !== solution.modifiedTime)
          .forEach((solution) => {
            if (goalReached(solution as Solution)) {
              this.changesManager.addChange({
                type: 'goalReached',
                time: Number(solution.modifiedTime) * 1000,
                solution,
              });
            } else if (goalFailed(solution as Solution)) {
              this.changesManager.addChange({
                type: 'goalFailed',
                time: Number(solution.modifiedTime) * 1000,
                solution: solution,
              });
            }
            // Otherwise it's just a regular update
            else {
              this.changesManager.addChange({
                type: 'solutionUpdated',
                time: Number(solution.modifiedTime) * 1000,
                solution: solution,
              });
            }
          });

        // Process solutions that passed their deadline
        result.data.deadlinePassed.forEach((solution) => {
          if (goalFailed(solution as Solution)) {
            this.changesManager.addChange({
              type: 'goalFailed',
              time: Number(solution.deadline) * 1000,
              solution: solution,
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
        now: dayjs().unix(),
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
    this.refreshButton.classList.add('rotating');
    this.isRefreshing = true;

    // Remove the class after animation completes
    setTimeout(() => {
      this.refreshButton.classList.remove('rotating');
      this.isRefreshing = false;
    }, 5 * 1000);

    // Only refresh userIdeasSolutionsController as it will trigger trackedChangesController
    // when it completes via fetchTrackedChanges()
    this.userIdeasSolutionsController.refresh();
  }

  private renderTrackedChanges() {
    if (this.error) {
      return html`
        <div class="full-width">
          <sl-alert variant="danger" open>
            <strong>Error loading changes:</strong>
            ${this.error.message}
          </sl-alert>
        </div>
      `;
    }

    if (!this.hasChanges) {
      return html`
        <div class="empty-state full-width">No recent changes to display.</div>
      `;
    }

    const changesToRender = this.changesManager.getChangesToRender();

    return cache(html`
      <div class="cards-container">
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
      </div>
    `);
  }

  render() {
    this.checkForAddressChangeAndSubscribe();
    return html`
      <div class="header-container full-width">
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
      ${this.loading
        ? html`
            <div class="full-width">
              <sl-spinner></sl-spinner>
            </div>
          `
        : html``}
      ${this.renderTrackedChanges()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tracked-changes': TrackedChanges;
  }
}
