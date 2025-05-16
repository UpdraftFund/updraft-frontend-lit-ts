import { LitElement, css } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { html, SignalWatcher } from '@lit-labs/signals';
import { cache } from 'lit/directives/cache.js';
import { Task } from '@lit/task';

import { formatUnits, fromHex, parseUnits } from 'viem';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';

dayjs.extend(relativeTime);
dayjs.extend(utc);

import chevronLeft from '@icons/navigation/chevron-left.svg';
import chevronRight from '@icons/navigation/chevron-right.svg';

import { dialogStyles } from '@styles/dialog-styles';

// Shoelace components
import '@shoelace-style/shoelace/dist/components/tag/tag.js';
import '@shoelace-style/shoelace/dist/components/badge/badge.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/avatar/avatar.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';
import { SlDialog } from '@shoelace-style/shoelace';

// Components
import '@components/solution/top-funders';
import '@components/solution/other-solutions';
import '@components/navigation/create-idea-button';
import '@components/navigation/search-bar';
import '@components/common/token-input';
import '@components/common/upd-dialog';
import '@components/common/share-dialog';
import '@components/common/transaction-watcher';
import { UpdDialog } from '@components/common/upd-dialog';
import { ShareDialog } from '@components/common/share-dialog';
import { TransactionWatcher } from '@components/common/transaction-watcher';
import { TokenInput } from '@components/common/token-input';

// Utils
import {
  parseProfile,
  shortNum,
  formatDate,
  calculateProgress,
  formatReward,
} from '@utils/format-utils';
import { modal } from '@utils/web3';
import { UrqlQueryController } from '@utils/urql-query-controller';

// GraphQL
import { Solution, SolutionDocument } from '@gql';
import { SolutionInfo, SolutionPosition } from '@/features/solution/types';

// Contracts
import { SolutionContract } from '@contracts/solution';

// State
import { updraftSettings } from '@state/common';
import layout from '@state/layout';
import { markComplete } from '@state/user/beginner-tasks';
import { userAddress } from '@state/user';

@customElement('solution-page')
export class SolutionPage extends SignalWatcher(LitElement) {
  static styles = [
    dialogStyles,
    css`
      :host {
        flex: 1;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        padding: 0.5rem 1rem;
        color: var(--main-foreground);
        background: var(--main-background);
      }

      .header-container {
        display: flex;
        flex-direction: column;
        gap: var(--sl-spacing-medium);
        padding: var(--sl-spacing-large);
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
        margin: 0 0 var(--sl-spacing-2x-small) 0;
        font-size: var(--sl-font-size-2x-large);
      }
      .idea-link {
        font-size: var(--sl-font-size-small);
        color: var(--sl-color-neutral-600);
      }
      .idea-link a {
        color: var(--sl-color-primary-600);
        text-decoration: none;
      }
      .idea-link a:hover {
        text-decoration: underline;
      }

      .status sl-badge {
        padding-top: 0.825rem;
      }

      .status sl-button::part(base) {
        color: var(--sl-color-primary-600);
      }

      .status sl-button::part(base):hover {
        color: var(--sl-color-primary-700);
      }
      .bottom-section {
        display: flex;
        flex-direction: column;
        flex-wrap: wrap;
        gap: var(--sl-spacing-large);
        margin-top: var(--sl-spacing-medium);
      }

      .creator-info a {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-small);
        width: fit-content;
      }

      .action-buttons {
        display: flex;
        flex-direction: column;
        width: 100%;
      }

      .action-buttons form {
        margin: 0;
      }

      .action-buttons token-input {
        min-width: 250px;
      }

      .solution-stats {
        display: flex;
        flex-direction: column;
        gap: var(--sl-spacing-small);
        padding: 1rem;
        background-color: var(--sl-color-neutral-100);
        border-radius: 10px;
        width: fit-content;
      }

      .solution-stats .stat-row {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-medium);
        margin-bottom: var(--sl-spacing-x-small);
      }

      .solution-stats .stat-label {
        min-width: 120px;
      }

      .solution-stats .progress-container {
        display: flex;
        flex-direction: column;
        gap: var(--sl-spacing-x-small);
      }

      .solution-stats .progress-bar {
        --height: 8px;
        --indicator-color: var(--sl-color-primary-600);
        --track-color: var(--sl-color-neutral-300);
      }

      .user-stake h3,
      .user-positions h3 {
        margin-top: 0;
        margin-bottom: var(--sl-spacing-small);
        font-size: var(--sl-font-size-large);
      }

      .positions-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--sl-spacing-medium);
      }

      .position-navigation {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-x-small);
      }

      .position-details p {
        margin: var(--sl-spacing-x-small) 0;
      }

      .status-message {
        margin-top: var(--sl-spacing-medium);
        padding: var(--sl-spacing-small);
        border-radius: var(--sl-radius-small);
        background-color: var(--sl-color-neutral-100);
      }

      .error {
        color: var(--sl-color-danger-600);
      }

      .solution-description h3,
      .solution-news h3,
      .solution-repository h3 {
        margin-top: 0;
        margin-bottom: var(--sl-spacing-small);
        font-size: var(--sl-font-size-large);
      }

      .solution-repository a {
        color: var(--sl-color-primary-600);
        text-decoration: none;
        word-break: break-all;
      }

      .solution-repository a:hover {
        text-decoration: underline;
      }
    `,
  ];

  @query('share-dialog', true) shareDialog!: ShareDialog;
  @query('upd-dialog', true) updDialog!: UpdDialog;
  @query('sl-dialog', true) approveDialog!: SlDialog;
  @query('token-input', true) tokenInput!: TokenInput;
  @query('transaction-watcher.refund') refundTransaction!: TransactionWatcher;
  @query('transaction-watcher.collect') collectTransaction!: TransactionWatcher;
  @query('transaction-watcher.stake') stakeTransaction!: TransactionWatcher;
  @query('transaction-watcher.fund') fundTransaction!: TransactionWatcher;
  @query('token-input.stake-input', true) stakeInput!: TokenInput;
  @query('token-input.fund-input', false) fundInput!: TokenInput;
  @query('form.stake-form', true) stakeForm!: HTMLFormElement;
  @query('form.fund-form', true) fundForm!: HTMLFormElement;

  @property() solutionId!: `0x${string}`;
  //TODO: each url should include a network
  //@property() network!: string;

  // Main solution data
  @state() private solution?: Solution;
  @state() private solutionInfo?: SolutionInfo;
  @state() private positionIndex = 0;
  @state() private goalFailed = false;
  @state() private goalReached = false;

  // State for loading and error handling
  @state() private loaded = false;
  @state() private error: string | null = null;

  // Array to store user positions
  private positions: SolutionPosition[] = [];

  // Controller for fetching solution data
  private readonly solutionController = new UrqlQueryController(
    this,
    SolutionDocument,
    { solutionId: this.solutionId },
    (result) => {
      this.loaded = true;

      if (result.error) {
        console.error('Error fetching solution data:', result.error);
        this.error = `Error loading solution: ${result.error.message}`;
        return;
      }

      if (result.data?.solution) {
        // Store the full solution object
        this.solution = result.data.solution as Solution;

        // Parse the solution info from the info field
        try {
          if (this.solution.info) {
            this.solutionInfo = JSON.parse(
              fromHex(this.solution.info as `0x${string}`, 'string')
            );
          }
        } catch (e) {
          console.error('Error parsing solution info:', e);
        }

        // Check solution status
        const now = dayjs().unix();
        const deadline = Number(this.solution.deadline || 0);
        const fundingGoal = BigInt(this.solution.fundingGoal || '0');
        const tokensContributed = BigInt(
          this.solution.tokensContributed || '0'
        );

        // Goal is reached if tokens contributed >= funding goal
        this.goalReached = tokensContributed >= fundingGoal;

        // Goal has failed if deadline has passed and goal not reached
        this.goalFailed = now > deadline && tokensContributed < fundingGoal;

        layout.rightSidebarContent.set(html`
          <top-funders
            .solutionId=${this.solutionId}
            .tokenSymbol=${this.fundInput?.tokenSymbol}
          ></top-funders>
          <other-solutions
            .ideaId=${this.solution.idea?.id}
            .currentSolutionId=${this.solutionId}
          ></other-solutions>
        `);
      } else {
        this.error = 'Solution not found.';
      }
    }
  );

  private readonly userStakeTask = new Task(
    this,
    async ([solutionId, address]) => {
      if (!solutionId || !address) return null;

      try {
        const solutionContract = new SolutionContract(solutionId);

        // Get user's stake
        const stake = (await solutionContract.read('stakes', [
          address,
        ])) as bigint;

        return stake > 0n ? stake : null;
      } catch (error) {
        console.warn('Error fetching user stake:', error);
        return null;
      }
    },
    () => [this.solutionId, userAddress.get()] as const
  );

  private readonly userPositionsTask = new Task(
    this,
    async ([solutionId, address]) => {
      if (!solutionId || !address) return null;

      try {
        const solutionContract = new SolutionContract(solutionId);

        // First, get the total number of positions
        const numPositions = (await solutionContract.read('numPositions', [
          address,
        ])) as bigint;

        // If user has no positions, return null
        if (numPositions === 0n) {
          this.positions = [];
          return null;
        }

        // Collect all positions
        const positions: SolutionPosition[] = [];

        // Check each position
        for (
          let positionIndex = 0n;
          positionIndex < numPositions;
          positionIndex++
        ) {
          try {
            // Get position details from positionsByAddress mapping
            const [contribution, , , refunded] = (await solutionContract.read(
              'positionsByAddress',
              [address, positionIndex]
            )) as [bigint, bigint, bigint, boolean];

            // Get fees earned and shares from checkPosition
            const [feesEarned] = (await solutionContract.read('checkPosition', [
              address,
              positionIndex,
            ])) as bigint[];

            const position: SolutionPosition = {
              contribution,
              refunded,
              feesEarned,
              positionIndex,
            };

            // Skip positions that have been refunded and have no fees left
            if (position.refunded && feesEarned === 0n) continue;

            positions.push(position);
          } catch (error) {
            // If position doesn't exist, skip it
            console.warn(`Position ${positionIndex} not available:`, error);
          }
        }

        // Store the positions and reset current index
        this.positions = positions;
        this.positionIndex = 0;
        return positions;
      } catch (error) {
        console.warn('Error fetching user positions:', error);
        this.positions = [];
        return null;
      }
    },
    () => [this.solutionId, userAddress.get()] as const
  );

  private previousPosition() {
    if (this.positions.length <= 1) return; // No need to navigate if only one position

    // Decrement position index, wrapping around to the end if needed
    this.positionIndex =
      this.positionIndex === 0
        ? this.positions.length - 1
        : this.positionIndex - 1;
  }

  private nextPosition() {
    if (this.positions.length <= 1) return; // No need to navigate if only one position

    // Increment position index, wrapping around to the beginning if needed
    this.positionIndex = (this.positionIndex + 1) % this.positions.length;
  }

  private renderStatusBadge() {
    if (this.goalFailed) {
      return html` <sl-badge variant="danger">Goal Failed</sl-badge> `;
    } else if (this.goalReached) {
      return html`
        <sl-badge variant="success">Goal Reached</sl-badge>
        ${this.solution?.drafter?.id === userAddress.get()
          ? html`
              <sl-button
                variant="text"
                size="small"
                href="/edit-solution/${this.solutionId}"
              >
                Edit
              </sl-button>
            `
          : html``}
      `;
    } else {
      return html` <sl-badge variant="primary">Active</sl-badge> `;
    }
  }

  private renderDrafter() {
    const profile = parseProfile(this.solution!.drafter.profile);
    const id = this.solution!.drafter.id;
    const displayName = profile.name || profile.team || id;
    return html`
      <a href="/profile/${id}">
        <user-avatar .address=${id} .image=${profile.image}></user-avatar>
        <span>${displayName}</span>
      </a>
    `;
  }

  private renderPositions() {
    const position = this.positions[this.positionIndex];

    return html`
      <div class="user-positions">
        <div class="positions-header">
          <h3>Your Positions</h3>
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
            Your contribution:
            <strong>
              ${shortNum(formatUnits(position.contribution, 18))}
              ${this.fundInput?.tokenSymbol}
            </strong>
          </p>
          <p>
            Fees earned:
            <strong>
              ${shortNum(formatUnits(position.feesEarned, 18))}
              ${this.fundInput?.tokenSymbol}
            </strong>
          </p>

          ${this.goalFailed
            ? html`
                <p class="status-message">
                  <strong>Goal Failed:</strong> You can refund your
                  contribution.
                </p>
                <sl-button variant="primary" @click=${this.handleRefund}>
                  Refund Position
                </sl-button>
              `
            : position.feesEarned > 0n
              ? html`
                  <p class="status-message">
                    <strong>Rewards Available:</strong> You can collect your
                    fees.
                  </p>
                  <sl-button variant="primary" @click=${this.handleCollectFees}>
                    Collect Fees
                  </sl-button>
                `
              : html`
                  <p class="status-message">
                    <strong>Position Active:</strong> No action needed at this
                    time.
                  </p>
                `}
        </div>
      </div>
    `;
  }

  private renderSolutionStats() {
    const progress = calculateProgress(this.solution);
    const deadline = formatDate(this.solution!.deadline, 'full');
    const totalStake = shortNum(formatUnits(this.solution!.stake, 18));
    const fundingTokenSymbol = this.fundInput?.tokenSymbol;

    return html`
      <div class="stat-row">
        <span class="stat-label">Progress:</span>
        <div class="progress-container">
          <sl-progress-bar
            class="progress-bar"
            value="${Math.min(progress, 100)}"
          ></sl-progress-bar>
          <span
            >🚀 <strong>${progress} %</strong> complete
            (${shortNum(formatUnits(this.solution!.tokensContributed, 18))} /
            ${shortNum(formatUnits(this.solution!.fundingGoal, 18))}
            ${fundingTokenSymbol})</span
          >
        </div>
      </div>
      <div class="stat-row">
        <span class="stat-label">Deadline:</span>
        <span>⏰ ${deadline}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Total Staked:</span>
        <span>💎 ${totalStake} UPD</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Funder Reward:</span>
        <span>🎁 ${formatReward(this.solution!.funderReward)}</span>
      </div>
    `;
  }

  private handleFormSubmit(e: Event) {
    e.preventDefault();
  }

  private async handleRefund() {
    try {
      if (this.positions.length === 0) {
        console.warn('No valid position to refund');
        return;
      }
      const currentPosition = this.positions[this.positionIndex];
      const solutionContract = new SolutionContract(this.solutionId);

      this.refundTransaction.hash = await solutionContract.write('refund', [
        currentPosition.positionIndex,
      ]);
    } catch (e) {
      console.error('Refund error:', e);
      if (e instanceof Error && e.message.startsWith('connection')) {
        modal.open({ view: 'Connect' });
      }
    }
  }

  // Handle collect fees transaction
  private async handleCollectFees() {
    try {
      if (this.positions.length === 0) {
        console.warn('No valid position to collect fees from');
        return;
      }
      const currentPosition = this.positions[this.positionIndex];
      const solutionContract = new SolutionContract(this.solutionId);

      this.collectTransaction.hash = await solutionContract.write(
        'collectFees',
        [currentPosition.positionIndex]
      );
    } catch (e) {
      console.error('Collect fees error:', e);
      if (e instanceof Error && e.message.startsWith('connection')) {
        modal.open({ view: 'Connect' });
      }
    }
  }

  private async handleStake() {
    if (!this.stakeForm.checkValidity()) {
      this.stakeForm.reportValidity(); // Show validation messages
      return;
    }
    const stake = parseUnits(this.stakeInput.value, 18);
    this.stakeTransaction.reset();
    try {
      const solutionContract = new SolutionContract(this.solutionId);
      this.stakeTransaction.hash = await solutionContract.write('addStake', [
        stake,
      ]);
    } catch (err) {
      this.stakeInput.handleTransactionError(
        err,
        () => this.handleStake(), // Retry after approval
        () => this.updDialog.show() // Show UPD dialog on low balance
      );
    }
  }

  private async handleFund() {
    if (!this.fundForm.checkValidity()) {
      this.fundForm.reportValidity(); // Show validation messages
      return;
    }
    const fund = parseUnits(this.fundInput.value, 18);
    this.fundTransaction.reset();
    try {
      const solutionContract = new SolutionContract(this.solutionId);
      this.fundTransaction.hash = await solutionContract.write('contribute', [
        fund,
      ]);
    } catch (err) {
      let onLowBalance = () => {};
      if (this.fundInput.tokenSymbol === 'UPD') {
        onLowBalance = () => this.updDialog.show();
      }
      this.fundInput.handleTransactionError(
        err,
        () => this.handleFund(), // Retry after approval
        onLowBalance
      );
    }
  }

  private handleRefundSuccess() {
    // Refresh positions after successful refund
    this.userPositionsTask.run();
  }

  private handleCollectSuccess() {
    // Refresh positions after successful fee collection
    this.userPositionsTask.run();
  }

  private handleStakeSuccess() {
    // Refresh user stake after successful stake
    this.userStakeTask.run();
  }

  private handleFundSuccess() {
    // Refresh user positions after successful funding
    this.userPositionsTask.run();

    // Show share dialog
    if (this.solution && this.solutionInfo) {
      this.shareDialog.url = `${window.location.origin}/solution/${this.solutionId}`;
      this.shareDialog.action = 'funded a Solution';
      this.shareDialog.topic = this.solutionInfo.name || 'Untitled Solution';
      this.shareDialog.show();

      // Mark beginner task as complete if it exists
      markComplete('fund-solution');
    }
  }

  // --- Lifecycle Methods ---

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
    // Update controller variables if solutionId changes
    if (changedProperties.has('solutionId') && this.solutionId) {
      this.loaded = false;
      this.error = null; // Clear previous errors
      this.positions = []; // Clear previous positions
      this.solutionController.setVariablesAndSubscribe({
        solutionId: this.solutionId,
      });
    }
  }

  render() {
    if (this.solution) {
      return cache(html`
        <div class="header-container">
          <div class="top-row">
            <div class="title-area">
              <h1>${this.solutionInfo?.name || 'Untitled Solution'}</h1>
              <div class="idea-link">
                Solution for idea:
                <a
                  href="/idea/${this.solution.idea?.id}"
                  title="View linked Idea"
                  >${this.solution.idea?.name || 'Unknown Idea'}</a
                >
              </div>
            </div>
            <div class="status">${this.renderStatusBadge()}</div>
          </div>
          <div class="creator-info">${this.renderDrafter()}</div>
        </div>

        <div class="solution-stats">${this.renderSolutionStats()}</div>

        <div class="bottom-section">
          <div class="action-buttons">
            ${!this.goalFailed && !this.goalReached
              ? html`
                  <form class="stake-form" @submit=${this.handleFormSubmit}>
                    <token-input
                      class="stake-input"
                      name="stake"
                      required
                      spendingContract=${this.solutionId}
                      spendingContractName="${this.solutionInfo?.name ||
                      'Solution'}"
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
                        @click=${this.handleStake}
                      >
                        Add Stake
                      </sl-button>
                    </token-input>
                  </form>
                `
              : html``}
            ${!this.goalFailed
              ? html`
                  <form class="fund-form" @submit=${this.handleFormSubmit}>
                    <token-input
                      class="fund-input"
                      name="fund"
                      required
                      spendingContract=${this.solutionId}
                      spendingContractName="${this.solutionInfo?.name ||
                      'Solution'}"
                      tokenAddress=${this.solution.fundingToken}
                      antiSpamFeeMode="none"
                      showDialogs="false"
                    >
                      ${this.solution.fundingToken ===
                      updraftSettings.get().updAddress
                        ? html`
                            <sl-button
                              slot="invalid"
                              variant="primary"
                              @click=${() => this.updDialog.show()}
                            >
                              Get more UPD
                            </sl-button>
                          `
                        : html`
                            <sl-button
                              slot="invalid"
                              variant="success"
                              disabled
                            >
                              Fund this Solution
                            </sl-button>
                          `}
                      <sl-button
                        slot="valid"
                        variant="success"
                        @click=${this.handleFund}
                      >
                        Fund this Solution
                      </sl-button>
                    </token-input>
                  </form>
                `
              : html``}
          </div>
        </div>

        ${this.userStakeTask.render({
          complete: (stake) => {
            if (stake) {
              return html`
                <div class="user-stake">
                  <h3>Your Stake</h3>
                  <p>
                    You have staked
                    <strong> ${shortNum(formatUnits(stake, 18))} UPD </strong>
                    in this solution.
                  </p>
                </div>
              `;
            }
            return html``;
          },
          pending: () => html` <sl-spinner></sl-spinner>`,
          error: (error) => html`<p class="error">${error}</p>`,
        })}
        ${this.userPositionsTask.render({
          complete: () =>
            this.positions.length > 0 ? this.renderPositions() : html``,
        })}
        ${this.solutionInfo?.description
          ? html`
              <div class="solution-description">
                <h3>Description</h3>
                <p>${this.solutionInfo.description}</p>
              </div>
            `
          : html``}
        ${this.solutionInfo?.news
          ? html`
              <div class="solution-news">
                <h3>Latest Updates</h3>
                <p>${this.solutionInfo.news}</p>
              </div>
            `
          : html``}
        ${this.solutionInfo?.repository
          ? html`
              <div class="solution-repository">
                <h3>Repository</h3>
                <a
                  href="${this.solutionInfo.repository}"
                  target="_blank"
                  rel="noopener"
                >
                  ${this.solutionInfo.repository}
                </a>
              </div>
            `
          : html``}

        <!-- Transaction watchers -->
        <upd-dialog></upd-dialog>
        <share-dialog></share-dialog>
        <transaction-watcher
          class="refund"
          @transaction-success=${this.handleRefundSuccess}
        ></transaction-watcher>
        <transaction-watcher
          class="collect"
          @transaction-success=${this.handleCollectSuccess}
        ></transaction-watcher>
        <transaction-watcher
          class="stake"
          @transaction-success=${this.handleStakeSuccess}
        ></transaction-watcher>
        <transaction-watcher
          class="fund"
          @transaction-success=${this.handleFundSuccess}
        ></transaction-watcher>
      `);
    } else {
      if (this.error) {
        return html`
          <div class="error-container">
            <h2>Error Loading Solution</h2>
            <p>${this.error}</p>
            <sl-button
              variant="primary"
              @click=${() => this.solutionController.refresh()}
              >Retry
            </sl-button>
          </div>
        `;
      } else if (this.loaded) {
        return html`
          <div class="error-container">
            <h2>Solution Not Found</h2>
            <p>Check the id in the URL.</p>
            <sl-button href="/discover" variant="primary">
              Browse Solutions
            </sl-button>
          </div>
        `;
      } else {
        return html` <sl-spinner></sl-spinner>`;
      }
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'solution-page': SolutionPage;
  }
}
