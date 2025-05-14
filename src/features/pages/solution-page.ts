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
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/avatar/avatar.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';
import { SlDialog } from '@shoelace-style/shoelace';

// Components
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
  shortenAddress,
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
      .solution-content {
        display: block;
      }

      .header-container {
        display: flex;
        flex-direction: column;
        gap: var(--sl-spacing-medium);
        margin-bottom: var(--sl-spacing-large);
        padding: var(--sl-spacing-large);
        background-color: var(--main-background);
        position: relative; /* For loading overlay */
        min-height: 150px; /* Ensure space for spinner */
      }
      .loading-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
        padding: var(--sl-spacing-large);
        background-color: var(--main-background);
        opacity: 0.9;
      }

      .error-message {
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
        padding: var(--sl-spacing-large);
        color: var(--no-results);
        font-style: italic;
        font-size: 1.2rem;
        background-color: var(--main-background);
        min-height: 150px;
        width: 100%;
        box-sizing: border-box;
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
      .status-tag sl-tag {
        font-weight: var(--sl-font-weight-semibold);
        padding-top: 0.5rem;
      }
      .bottom-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--sl-spacing-large);
        flex-wrap: wrap; /* Allow wrapping on smaller screens */
        margin-top: var(
          --sl-spacing-medium
        ); /* Add some space above this row */
      }
      .creator-info {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-small);
        flex-shrink: 0; /* Prevent creator info from shrinking too much */
        margin-bottom: var(--sl-spacing-medium);
      }
      .creator-info span {
        /* Style for the creator name/address */
        font-weight: var(--sl-font-weight-medium);
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
        padding: 0 1rem;
        background-color: var(--sl-color-neutral-50);
        border-radius: var(--sl-border-radius-medium);
        box-shadow: var(--sl-shadow-x-small);
      }

      .solution-stats h3 {
        margin-top: 0;
        margin-bottom: var(--sl-spacing-small);
        font-size: var(--sl-font-size-large);
      }

      .solution-stats .stat-row {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-medium);
        margin-bottom: var(--sl-spacing-x-small);
      }

      .solution-stats .stat-label {
        font-weight: var(--sl-font-weight-semibold);
        min-width: 120px;
      }

      .solution-stats .progress-container {
        display: flex;
        flex-direction: column;
        gap: var(--sl-spacing-x-small);
        width: 100%;
      }

      .solution-stats .progress-bar {
        --height: 8px;
        --track-color: var(--sl-color-neutral-200);
        --indicator-color: var(--sl-color-primary-600);
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
  @query('token-input.fund-input', true) fundInput!: TokenInput;
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

  // State for loading and error handling
  @state() private isLoading = false;
  @state() private error: string | null = null;

  // Array to store user positions
  private positions: SolutionPosition[] = [];

  // Controller for fetching solution data
  private readonly solutionController = new UrqlQueryController(
    this,
    SolutionDocument,
    { solutionId: this.solutionId },
    (result) => {
      this.isLoading = false;

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

        // Check if goal has failed (deadline passed and goal not reached)
        const now = dayjs().unix();
        const deadline = Number(this.solution.deadline || 0);
        const fundingGoal = BigInt(this.solution.fundingGoal || '0');
        const tokensContributed = BigInt(
          this.solution.tokensContributed || '0'
        );
        this.goalFailed = now > deadline && tokensContributed < fundingGoal;
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

  // Handle position navigation
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

  // Handle refund transaction
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

  // Handle form submission for adding stake
  private async handleStakeSubmit(e: Event) {
    e.preventDefault();
    if (this.stakeForm.checkValidity()) {
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
          () => this.handleStakeSubmit(e), // Retry after approval
          () => this.updDialog.show() // Show UPD dialog on low balance
        );
      }
    } else {
      this.stakeForm.reportValidity(); // Show validation messages
    }
  }

  // Handle form submission for funding
  private async handleFundSubmit(e: Event) {
    e.preventDefault();
    if (this.fundForm.checkValidity()) {
      const fund = parseUnits(this.fundInput.value, 18);
      this.fundTransaction.reset();
      try {
        const solutionContract = new SolutionContract(this.solutionId);
        this.fundTransaction.hash = await solutionContract.write('contribute', [
          fund,
        ]);
      } catch (err) {
        this.fundInput.handleTransactionError(
          err,
          () => this.handleFundSubmit(e), // Retry after approval
          () => this.updDialog.show() // Show UPD dialog on low balance
        );
      }
    } else {
      this.fundForm.reportValidity(); // Show validation messages
    }
  }

  // Handle transaction success
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
      this.isLoading = true;
      this.error = null; // Clear previous errors
      this.positions = []; // Clear previous positions
      this.solutionController.setVariablesAndSubscribe({
        solutionId: this.solutionId,
      });
    }
  }

  render() {
    if (!this.solutionId && !this.isLoading) {
      return html` <p>Solution not found or ID missing.</p> `;
    }

    return html`
      <div class="solution-content container mx-auto px-4 py-8">
        <div class="header-container">
          ${this.isLoading
            ? html`<div class="loading-overlay">
                <sl-spinner style="font-size: 2rem;"></sl-spinner>
              </div>`
            : html``}
          ${this.error
            ? html` <div class="error-message">${this.error}</div>`
            : html``}
          ${!this.isLoading && !this.error && this.solution
            ? cache(html`
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
                  <div class="status-tag">
                    <sl-tag size="large" variant="primary" pill
                      >${this.goalFailed ? 'Failed' : 'Active'}
                    </sl-tag>
                  </div>
                </div>

                <div class="creator-info">
                  <sl-tooltip content="Solution Drafter">
                    ${this.solution.drafter
                      ? (() => {
                          const profile = parseProfile(
                            this.solution!.drafter.profile
                          );
                          return html`
                            <sl-avatar
                              image="${profile.image || '/default-avatar.png'}"
                              label="Creator Avatar"
                              initials="${profile.name
                                ? html``
                                : shortenAddress(
                                    this.solution!.drafter.id
                                  ).substring(0, 6)}"
                            ></sl-avatar>
                          `;
                        })()
                      : html``}
                  </sl-tooltip>
                  <!-- <user-link userId=${this.solution.drafter
                    ?.id}></user-link> -->
                  <span>
                    ${(() => {
                      if (this.solution?.drafter) {
                        const profile = parseProfile(
                          this.solution.drafter.profile
                        );
                        return (
                          profile.name ||
                          shortenAddress(this.solution.drafter.id)
                        );
                      }
                      return html``;
                    })()}
                  </span>
                </div>

                <div class="solution-stats">
                  <h3>Solution Details</h3>
                  ${(() => {
                    // Calculate progress percentage
                    const progress = calculateProgress(
                      this.solution!.tokensContributed,
                      this.solution!.fundingGoal
                    );

                    // Format deadline
                    const deadline = formatDate(
                      Number(this.solution!.deadline)
                    );

                    // Format total stake
                    const totalStake = shortNum(
                      formatUnits(this.solution!.stake, 18)
                    );

                    // Get funding token symbol from the fund-input component
                    // We'll use a fallback until the token-input loads
                    const fundingTokenSymbol =
                      this.fundInput?.tokenSymbol || 'USDC';

                    // Staking is always done in UPD
                    const stakingTokenSymbol = 'UPD';

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
                            (${shortNum(
                              formatUnits(this.solution!.tokensContributed, 18)
                            )}
                            /
                            ${shortNum(
                              formatUnits(this.solution!.fundingGoal, 18)
                            )}
                            ${fundingTokenSymbol})</span
                          >
                        </div>
                      </div>
                      <div class="stat-row">
                        <span class="stat-label">Deadline:</span>
                        <span>⏰ ${deadline.full}</span>
                      </div>
                      <div class="stat-row">
                        <span class="stat-label">Total Staked:</span>
                        <span>💎 ${totalStake} ${stakingTokenSymbol}</span>
                      </div>
                      <div class="stat-row">
                        <span class="stat-label">Funder Reward:</span>
                        <span
                          >🎁 ${formatReward(this.solution!.funderReward)}</span
                        >
                      </div>
                    `;
                  })()}
                </div>

                <div class="bottom-row">
                  <div class="action-buttons">
                    <form class="stake-form" @submit=${this.handleStakeSubmit}>
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
                        <sl-button slot="valid" variant="primary" type="submit">
                          Add Stake
                        </sl-button>
                      </token-input>
                    </form>

                    <form class="fund-form" @submit=${this.handleFundSubmit}>
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
                          : html``}
                        <sl-button slot="valid" variant="success" type="submit">
                          Fund this Solution
                        </sl-button>
                      </token-input>
                    </form>
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
                            <strong>
                              ${shortNum(formatUnits(stake, 18))} UPD
                            </strong>
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
                  complete: () => {
                    // Check if we have any positions
                    if (this.positions.length > 0) {
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
                                ${shortNum(
                                  formatUnits(position.contribution, 18)
                                )}
                                ${this.fundInput?.tokenSymbol || 'USDC'}
                              </strong>
                            </p>
                            <p>
                              Fees earned:
                              <strong>
                                ${shortNum(
                                  formatUnits(position.feesEarned, 18)
                                )}
                                ${this.fundInput?.tokenSymbol || 'USDC'}
                              </strong>
                            </p>

                            ${this.goalFailed
                              ? html`
                                  <p class="status-message">
                                    <strong>Goal Failed:</strong> You can refund
                                    your contribution.
                                  </p>
                                  <sl-button
                                    variant="primary"
                                    @click=${this.handleRefund}
                                  >
                                    Refund Position
                                  </sl-button>
                                `
                              : position.feesEarned > 0n
                                ? html`
                                    <p class="status-message">
                                      <strong>Rewards Available:</strong> You
                                      can collect your fees.
                                    </p>
                                    <sl-button
                                      variant="primary"
                                      @click=${this.handleCollectFees}
                                    >
                                      Collect Fees
                                    </sl-button>
                                  `
                                : html`
                                    <p class="status-message">
                                      <strong>Position Active:</strong> No
                                      action needed at this time.
                                    </p>
                                  `}
                          </div>
                        </div>
                      `;
                    }
                    return html``;
                  },
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
              `)
            : html``}
        </div>

        <!-- Additional solution content can be added here -->
      </div>

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
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'solution-page': SolutionPage;
  }
}
