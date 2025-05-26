import { customElement, property, query, state } from 'lit/decorators.js';
import { css, LitElement } from 'lit';
import { html, SignalWatcher } from '@lit-labs/signals';
import { cache } from 'lit/directives/cache.js';
import { Task } from '@lit/task';

import { fromHex, parseUnits } from 'viem';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

// Icons
import chevronLeft from '@icons/navigation/chevron-left.svg';
import chevronRight from '@icons/navigation/chevron-right.svg';
import plusLgIcon from '@icons/navigation/plus-lg.svg';

// Styles
import { dialogStyles } from '@styles/dialog-styles';

// Shoelace components
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import { SlDialog, SlCheckbox } from '@shoelace-style/shoelace';

// Components
import '@components/idea/top-supporters';
import '@components/idea/idea-solutions';
import '@components/idea/related-ideas';
import '@components/navigation/create-idea-button';
import '@components/navigation/search-bar';
import '@components/common/token-input';
import '@components/common/upd-dialog';
import '@components/common/share-dialog';
import '@components/common/transaction-watcher';
import '@components/common/cycle-info';
import '@components/user/user-avatar';
import { UpdDialog } from '@components/common/upd-dialog';
import { ShareDialog } from '@components/common/share-dialog';
import { TransactionWatcher } from '@components/common/transaction-watcher';
import { TokenInput } from '@components/common/token-input';

// Utils
import { formatAmount, formatDate, formatReward } from '@utils/format-utils';
import { modal } from '@utils/web3';
import { UrqlQueryController } from '@utils/urql-query-controller';

// GraphQL
import { Idea, IdeaDocument } from '@gql';

// Types
import type { IdeaPosition } from '@/features/idea/types';

// State
import { updraftSettings } from '@state/common';
import layout from '@state/layout';
import { markComplete } from '@state/user/beginner-tasks';
import { userAddress } from '@state/user';

// Contracts
import { IdeaContract } from '@contracts/idea';
import { updraft } from '@contracts/updraft';

@customElement('idea-page')
export class IdeaPage extends SignalWatcher(LitElement) {
  static styles = [
    dialogStyles,
    css`
      main {
        flex: 1;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 2rem;
        padding: 2rem;
      }

      .header-container {
        display: flex;
        flex-direction: column;
        gap: var(--sl-spacing-medium);
        background-color: var(--main-background);
      }

      .error-container {
        display: flex;
        flex-direction: column;
        padding: 2rem;
        gap: 1rem;
      }

      .error-container h2 {
        color: var(--sl-color-danger-600);
        margin: 0;
      }

      .error-container p {
        max-width: 500px;
      }

      sl-button {
        max-width: fit-content;
      }

      .top-row {
        display: flex;
        align-items: flex-start;
        gap: var(--sl-spacing-medium);
      }

      .title-area h1 {
        margin: 0 0 var(--sl-spacing-x-small) 0;
        font-size: var(--sl-font-size-2x-large);
      }

      .creator {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-small);
        width: fit-content;
      }

      .action-buttons {
        display: flex;
        flex-direction: column;
      }

      .action-buttons form {
        margin: 0;
      }

      .action-buttons token-input {
        min-width: 250px;
      }

      .idea-stats {
        display: flex;
        flex-direction: column;
        gap: var(--sl-spacing-small);
        padding: 1rem;
        background-color: var(--sl-color-neutral-100);
        border-radius: 10px;
        width: fit-content;
        margin-top: 1rem;
      }

      .idea-stats .stat-row {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-medium);
        margin-bottom: var(--sl-spacing-x-small);
      }

      .idea-stats .stat-label {
        min-width: 120px;
      }

      .error {
        color: var(--sl-color-danger-600);
      }

      .idea-description h3,
      .idea-repository h3 {
        margin-top: 0;
        margin-bottom: var(--sl-spacing-small);
        font-size: var(--sl-font-size-large);
      }

      .idea-repository a {
        color: var(--sl-color-primary-600);
        text-decoration: none;
        word-break: break-all;
      }

      .idea-repository a:hover {
        text-decoration: underline;
      }

      .user-positions {
        background-color: var(--subtle-background);
        border-radius: 0.5rem;
        padding: 1rem;
        margin: 1rem 0;
        max-width: 500px;
      }

      .positions-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }

      .user-positions h3 {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 600;
      }

      .position-navigation {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .position-navigation sl-icon-button::part(base) {
        font-size: 1.2rem;
        color: var(--sl-color-neutral-600);
      }

      .position-navigation sl-icon-button::part(base):hover {
        color: var(--accent);
      }

      .position-navigation span {
        font-size: 0.9rem;
        color: var(--sl-color-neutral-600);
      }

      .position-details {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .position-details p {
        margin: 0;
      }

      .position-details sl-button {
        margin-top: 0.5rem;
        align-self: flex-start;
      }
    `,
  ];

  @query('form', true) form!: HTMLFormElement;
  @query('share-dialog', true) shareDialog!: ShareDialog;
  @query('upd-dialog', true) updDialog!: UpdDialog;
  @query('transaction-watcher.submit', true)
  submitTransaction!: TransactionWatcher;
  @query('transaction-watcher.approve', true)
  approveTransaction!: TransactionWatcher;
  @query('transaction-watcher.withdraw', true)
  withdrawTransaction!: TransactionWatcher;
  @query('sl-dialog', true) approveDialog!: SlDialog;
  @query('token-input', true) tokenInput!: TokenInput;
  @query('sl-checkbox', true) airdropCheckbox!: SlCheckbox;

  @state() private idea?: Idea;
  @state() private error: string | null = null;
  @state() private loaded: boolean = false;
  // Track current position index for navigation
  @state() private positionIndex: number = 0;

  private positions: IdeaPosition[] = [];

  @property() ideaId!: `0x${string}`;
  //TODO: each url should include a network
  //@property() network!: string;

  private readonly ideaController = new UrqlQueryController(
    this,
    IdeaDocument,
    { ideaId: this.ideaId },
    (result) => {
      this.loaded = true;

      if (result.error) {
        this.error = result.error.message;
        return;
      }

      this.idea = result.data?.idea as Idea;

      if (this.idea) {
        layout.rightSidebarContent.set(html`
          <top-supporters .ideaId=${this.ideaId}></top-supporters>
          <related-ideas
            .ideaId=${this.ideaId}
            .tags=${this.idea.tags}
          ></related-ideas>
        `);
      }
    }
  );

  // Tasks for loading user data
  private readonly userPositionsTask = new Task(this, {
    task: async () => {
      if (!this.idea || !userAddress.get()) return null;

      try {
        const address = userAddress.get() as `0x${string}`;
        const idea = new IdeaContract(this.ideaId);

        // Get number of positions for this user
        const numPositions = (await idea.read('numPositionsByAddress', [
          address,
        ])) as bigint;

        // If user has no positions, return null
        if (numPositions === 0n) {
          this.positions = [];
          return null;
        }

        const minFee = (await updraft.read('minFee')) as bigint;
        const percentFee = (await updraft.read('percentFee')) as bigint;
        const percentScale = (await updraft.read('percentScale')) as bigint;
        const [firstCycle] = (await idea.read('cycles', [0n])) as bigint[];

        // Collect all viable positions
        const viablePositions: IdeaPosition[] = [];

        // Check each position
        for (
          let positionIndex = 0n;
          positionIndex < numPositions;
          positionIndex++
        ) {
          try {
            const [contributionCycle, contributionAfterFees] = (await idea.read(
              'positionsByAddress',
              [address, positionIndex]
            )) as bigint[];

            // Skip positions with zero value (already withdrawn)
            if (contributionAfterFees <= 0n) continue;

            let originalContribution = contributionAfterFees;

            // No contributor fees are paid in the first cycle
            if (contributionCycle > firstCycle) {
              const funderReward = this.idea?.funderReward;
              if (funderReward && percentScale > funderReward) {
                originalContribution =
                  (contributionAfterFees * percentScale) /
                  (percentScale - BigInt(funderReward));
              }
            }

            const contributionBeforeAntiSpamFee =
              originalContribution > minFee
                ? originalContribution
                : originalContribution + minFee;

            viablePositions.push({
              positionIndex,
              contribution: contributionBeforeAntiSpamFee,
              contributionCycle,
              refunded: false,
            });
          } catch (error) {
            console.error(
              `Error fetching position ${positionIndex} for ${address}:`,
              error
            );
          }
        }

        // Store positions and return the count
        this.positions = viablePositions;
        return viablePositions.length > 0 ? viablePositions.length : null;
      } catch (error) {
        console.error('Error fetching user positions:', error);
        return null;
      }
    },
    args: () => [this.idea, userAddress.get()],
  });

  // Task to fetch cycle information
  private readonly cycleInfoTask = new Task(this, {
    task: async () => {
      if (!this.idea) return null;

      try {
        const idea = new IdeaContract(this.ideaId);
        const cycleLength = await idea.read('cycleLength') as bigint;
        const startTime = await idea.read('startTime') as bigint;
        
        return {
          cycleLength,
          startTime
        };
      } catch (error) {
        console.error('Error fetching cycle information:', error);
        return null;
      }
    },
    args: () => [this.idea],
  });

  // Task to fetch user's support for this idea
  private readonly userSupportTask = new Task(
    this,
    async ([ideaId, address]) => {
      if (!ideaId || !address) return null;

      try {
        const idea = new IdeaContract(ideaId);

        const numPositions = (await idea.read('numPositions', [
          address,
        ])) as bigint;

        // If user has no positions, return null
        if (numPositions === 0n) {
          this.positions = [];
          return null;
        }

        const minFee = (await updraft.read('minFee')) as bigint;
        const percentFee = (await updraft.read('percentFee')) as bigint;
        const percentScale = (await updraft.read('percentScale')) as bigint;
        const [firstCycle] = (await idea.read('cycles', [0n])) as bigint[];

        // Collect all viable positions
        const viablePositions: IdeaPosition[] = [];

        // Check each position
        for (
          let positionIndex = 0n;
          positionIndex < numPositions;
          positionIndex++
        ) {
          try {
            // Get current position (includes earnings)
            const [currentPosition] = (await idea.read('checkPosition', [
              address,
              positionIndex,
            ])) as bigint[];

            // Skip positions with zero value (already withdrawn)
            if (currentPosition <= 0n) continue;

            // Get original contribution from positionsByAddress mapping
            const [contributionCycle, contributionAfterFees] = (await idea.read(
              'positionsByAddress',
              [address, positionIndex]
            )) as bigint[];

            // Skip positions with zero value (already withdrawn)
            if (contributionAfterFees <= 0n) continue;

            let originalContribution = contributionAfterFees;

            // No contributor fees are paid in the first cycle
            if (contributionCycle > firstCycle) {
              const funderReward = this.idea?.funderReward;
              if (funderReward && percentScale > funderReward) {
                originalContribution =
                  (contributionAfterFees * percentScale) /
                  (percentScale - BigInt(funderReward));
              }
            }

            const contributionBeforeAntiSpamFee =
              (originalContribution * percentScale) /
              (percentScale - percentFee);

            // Use the greater of the minFee and percentFee, like the smart contract
            if (contributionBeforeAntiSpamFee > originalContribution + minFee) {
              originalContribution = contributionBeforeAntiSpamFee;
            } else {
              originalContribution += minFee;
            }

            viablePositions.push({
              originalContribution,
              feesPaid: originalContribution - contributionAfterFees,
              currentPosition,
              earnings: currentPosition - originalContribution,
              positionIndex,
            });
          } catch (error) {
            // If position doesn't exist (already withdrawn), skip it
            console.warn(`Position ${positionIndex} not available:`, error);
          }
        }

        // Store the viable positions and reset current index
        this.positions = viablePositions;
        this.positionIndex = 0;
        return viablePositions;
      } catch (error) {
        console.warn('Error fetching user support:', error);
        this.positions = [];
        return null;
      }
    },
    () => [this.ideaId, userAddress.get()] as const
  );

  // Handle withdraw support
  private async handleWithdraw() {
    try {
      if (this.positions.length === 0) {
        console.warn('No valid position to withdraw');
        return;
      }

      const currentPosition = this.positions[this.positionIndex];
      const idea = new IdeaContract(this.ideaId);

      this.withdrawTransaction.hash = await idea.write('withdraw', [
        currentPosition.positionIndex,
      ]);
    } catch (e) {
      console.error('Withdraw error:', e);
      if (e instanceof Error && e.message.startsWith('connection')) {
        modal.open({ view: 'Connect' });
      }
    }
  }

  private previousPosition() {
    if (this.positions.length <= 1) return; // No need to navigate if only one position
    this.positionIndex =
      (this.positionIndex - 1 + this.positions.length) % this.positions.length;
  }

  private nextPosition() {
    if (this.positions.length <= 1) return; // No need to navigate if only one position
    this.positionIndex = (this.positionIndex + 1) % this.positions.length;
  }

  @state() private isAirdropMode = false;

  private updateAirdropMode = () => {
    this.isAirdropMode = this.airdropCheckbox.checked;
  };

  private async handleSubmit(e: Event) {
    e.preventDefault();
  }

  private async handleSupport() {
    if (this.form.checkValidity()) {
      const support = parseUnits(this.tokenInput.value, 18);
      this.updateAirdropMode();
      this.submitTransaction.reset();
      try {
        const idea = new IdeaContract(this.ideaId);
        if (this.isAirdropMode) {
          this.submitTransaction.hash = await idea.write('airdrop', [support]);
        } else {
          this.submitTransaction.hash = await idea.write('contribute', [
            support,
          ]);
        }
      } catch (err) {
        this.tokenInput.handleTransactionError(
          err,
          () => this.handleSupport(), // Retry after approval
          () => this.updDialog.show() // Show UPD dialog on low balance
        );
      }
    } else {
      this.form.reportValidity(); // Show validation messages
    }
  }

  private async handleSupportSucces() {
    // Handle the success of the contribution or airdrop
    this.shareDialog.url = `${window.location.origin}/idea/${this.ideaId}`;
    this.approveDialog.hide();
    this.shareDialog.show();
    markComplete('support-idea');
    this.userSupportTask.run();
  }

  private async handleWithdrawSuccess() {
    this.userSupportTask.run();
    // If the position was successfully withdrawn, it will be removed from the viable positions
    // If there are no more positions, the UI will update automatically
  }

  private renderIdea() {
    if (this.idea) {
      const { name, description, creator, createdAt, repository } = this.idea;

      return html`
        <main>
          <div class="header-container">
            <div class="top-row">
              <div class="title-area">
                <h1>${name}</h1>
              </div>
              ${this.isCreator
                ? html`
                    <sl-button
                      class="edit-button"
                      pill
                      size="medium"
                      href="/edit-idea/${this.ideaId}"
                      >Edit
                    </sl-button>
                  `
                : html``}
            </div>
            ${this.renderCreator()}
          </div>

          <div class="idea-stats">
            ${this.renderIdeaStats()}
          </div>

          <div class="action-buttons">
            <form @submit=${this.handleFormSubmit}>
              <token-input
                name="support"
                required
                spendingContract=${this.ideaId}
                spendingContractName="${name}"
                antiSpamFeeMode="none"
                showDialogs="false"
              >
                <sl-button
                  slot="invalid"
                  variant="primary"
                  @click=${() => this.updDialog.show()}
                >
                  Get more UPD
                </sl-button>
                <sl-button
                  slot="valid"
                  variant="primary"
                  @click=${this.handleSupport}
                >
                  Support this Idea
                </sl-button>
              </token-input>
              <transaction-watcher
                @transaction-success=${this.handleSupportSuccess}
              ></transaction-watcher>
            </form>
          </div>

          ${this.userPositionsTask.render({
            complete: () =>
              this.positions.length > 0 ? this.renderPositions() : html``,
          })}

          ${description
            ? html`
                <div class="idea-description">
                  <h3>Description</h3>
                  <p>${description}</p>
                </div>
              `
            : html``}
          ${repository
            ? html`
                <div class="idea-repository">
                  <h3>Repository</h3>
                  <a
                    href="${repository}"
                    target="_blank"
                    rel="noopener"
                  >
                    ${repository}
                  </a>
                </div>
              `
            : html``}

          <idea-solutions .ideaId=${this.ideaId}></idea-solutions>
          <related-ideas .ideaId=${this.ideaId}></related-ideas>
        </main>
      `;
    } else {
      if (this.error) {
        return html`
          <div class="error-container">
            <h2>Error Loading Idea</h2>
            <p>${this.error}</p>
            <sl-button
              variant="primary"
              @click=${() => this.ideaController.refresh()}
              >Retry
            </sl-button>
          </div>
        `;
      } else if (this.loaded) {
        return html`
          <div class="error-container">
            <h2>Idea Not Found</h2>
            <p>Check the id in the URL.</p>
            <sl-button href="/discover?tab=ideas" variant="primary">
              Browse Ideas
            </sl-button>
          </div>
        `;
      } else {
        return html` <sl-spinner></sl-spinner>`;
      }
    }
  }

  private renderIdeaStats() {
    if (!this.idea) return html``;

    const {
      tokensContributed,
      creator,
      createdAt,
      funderReward,
    } = this.idea;

    return html`
      <div class="stat-row">
        <span class="stat-label">Created</span>
        <span>${formatDate(createdAt)}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Total Support</span>
        <span>${formatAmount(tokensContributed)} UPD</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Funder Reward</span>
        <span>${formatReward(funderReward)}</span>
      </div>
      ${this.cycleInfoTask.render({
        pending: () => html`<div class="stat-row">
          <span class="stat-label">Cycle</span>
          <span>Loading cycle information...</span>
        </div>`,
        complete: (cycleInfo) => {
          if (!cycleInfo) return html``;
          return html`
            <div class="stat-row">
              <cycle-info
                .cycleLength=${cycleInfo.cycleLength}
                .startTime=${cycleInfo.startTime}
              ></cycle-info>
            </div>
          `;
        },
        error: (error) => html`<div class="stat-row">
          <span class="stat-label">Cycle</span>
          <span class="error">Error loading cycle info</span>
        </div>`
      })}
    `;
  }

  private renderCreator() {
    if (!this.idea || !this.idea.creator) return html``;

    try {
      const { creator } = this.idea;
      const profile = parseProfile(creator.profile as `0x${string}`);
      const displayName = profile.name || profile.team || creator.id;

      return html`
        <div class="creator">
          <user-avatar
            .address=${creator.id}
            .image=${profile.image}
          ></user-avatar>
          <a href="/profile/${creator.id}" title="View creator profile">
            ${displayName}
          </a>
        </div>
      `;
    } catch (error) {
      console.error('Error rendering creator:', error);
      return html``;
    }
  }

  private renderPositions() {
    if (this.positions.length === 0) return html``;

    const position = this.positions[this.positionIndex];

    return html`
      <div class="user-positions">
        <div class="positions-header">
          <h3>Your Support</h3>
          ${this.positions.length > 1
            ? html`
                <div class="position-navigation">
                  <sl-icon-button
                    src=${chevronLeft}
                    label="Previous position"
                    @click=${this.previousPosition}
                  ></sl-icon-button>
                  <span
                    >Position ${this.positionIndex + 1} of
                    ${this.positions.length}</span
                  >
                  <sl-icon-button
                    src=${chevronRight}
                    label="Next position"
                    @click=${this.nextPosition}
                  ></sl-icon-button>
                </div>
              `
            : html``}
        </div>
        <div class="position-details">
          <p>
            You contributed
            <strong>${formatAmount(position.contribution)} UPD</strong>
            in cycle ${position.contributionCycle.toString()}
          </p>
          <sl-button variant="primary" @click=${this.handleWithdraw}>
            Withdraw Support
          </sl-button>
          <transaction-watcher
            class="withdraw"
            @transaction-success=${this.handleWithdrawSuccess}
          ></transaction-watcher>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    layout.topBarContent.set(html`
      <create-idea-button></create-idea-button>
      <search-bar></search-bar>
    `);
    layout.showLeftSidebar.set(true);
    // initially set the right sidebar to empty html
    layout.rightSidebarContent.set(html``);
    layout.showRightSidebar.set(true);
  }

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    if (changedProperties.has('ideaId') && this.ideaId) {
      this.loaded = false;
      this.error = null;
      this.ideaController.setVariablesAndSubscribe({ ideaId: this.ideaId });
    }
  }

  render() {
    return html`
      ${this.renderIdea()}
      <upd-dialog></upd-dialog>
      <share-dialog></share-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'idea-page': IdeaPage;
  }
}
