import { LitElement, css } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { html, SignalWatcher } from '@lit-labs/signals';
import { cache } from 'lit/directives/cache.js';
import { Task } from '@lit/task';

import { parseUnits } from 'viem';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import chevronLeft from '@icons/navigation/chevron-left.svg';
import chevronRight from '@icons/navigation/chevron-right.svg';

import { dialogStyles } from '@styles/dialog-styles';

// Shoelace components
import '@shoelace-style/shoelace/dist/components/tag/tag.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
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
import '@components/user/user-avatar';
import { UpdDialog } from '@components/common/upd-dialog';
import { ShareDialog } from '@components/common/share-dialog';
import { TransactionWatcher } from '@components/common/transaction-watcher';
import { TokenInput } from '@components/common/token-input';

// Utils
import { formatDate, formatReward, formatAmount } from '@utils/format-utils';
import {
  calculateProgress,
  goalFailed,
  goalReached,
  parseSolutionInfo,
} from '@utils/solution/solution-utils';
import { parseProfile } from '@utils/user/user-utils';
import { modal } from '@utils/web3';
import { UrqlQueryController } from '@utils/urql-query-controller';
import { setSolutionMetaTags, resetMetaTags } from '@utils/meta-utils';

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
      main {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2rem;
        padding: 2rem 2rem 0;
      }
      .header-container {
        display: flex;
        flex-direction: column;
        gap: var(--sl-spacing-medium);
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
      .drafter {
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
      .goal-reached,
      .goal-failed {
        border-radius: var(--sl-border-radius-medium);
        padding: var(--sl-spacing-medium);
        width: fit-content;
      }
      .goal-reached p,
      .goal-failed p {
        margin-top: 0;
      }
      .goal-reached {
        background-color: var(--sl-color-success-100);
        border-left: 3px solid var(--sl-color-success-600);
      }
      .goal-failed {
        background-color: var(--sl-color-danger-100);
        border-left: 3px solid var(--sl-color-danger-600);
      }
      .withdraw-funds-row {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-medium);
      }
      .withdrawal-status {
        font-size: var(--sl-font-size-small);
        color: var(--sl-color-neutral-700);
      }
      .user-stake h3,
      .user-positions h3 {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 500;
      }
      .user-stake,
      .user-positions {
        background-color: var(--subtle-background);
        border-radius: 0.5rem;
        padding: 1rem;
        max-width: 500px;
      }
      .positions-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
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
        text-wrap: nowrap;
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
      .button-row {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.5rem;
        align-self: flex-start;
      }
      .error {
        color: var(--sl-color-danger-600);
      }
      .item-with-tooltip {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .info-icon {
        font-size: 0.75rem;
        cursor: help;
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
  @query('transaction-watcher.remove-stake')
  removeStakeTransaction!: TransactionWatcher;
  @query('transaction-watcher.withdraw-funds')
  withdrawFundsTransaction!: TransactionWatcher;
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

  // State for loading and error handling
  @state() private loaded = false;
  @state() private error: string | null = null;
  @state() private tokensWithdrawn: bigint = 0n;

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
        this.solutionInfo = parseSolutionInfo(this.solution.info);

        setSolutionMetaTags(this.solution);

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
        const solution = new SolutionContract(solutionId);

        // First, get the total number of positions
        const numPositions = (await solution.read('numPositions', [
          address,
        ])) as bigint;

        // If user has no positions, return null
        if (numPositions === 0n) {
          this.positions = [];
          return null;
        }

        const percentScale = BigInt(updraftSettings.get().percentScale);

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
            const [contributionAfterFees, , contributionCycle] =
              (await solution.read('positionsByAddress', [
                address,
                positionIndex,
              ])) as [bigint, bigint, bigint, bigint, boolean];

            // Get fees earned from checkPosition
            const [feesEarned] = (await solution.read('checkPosition', [
              address,
              positionIndex,
            ])) as bigint[];

            const refundable = await solution.willSucceed('refund', [
              positionIndex,
            ]);

            let contribution = contributionAfterFees;

            // No contributor fees are paid in the first cycle
            if (contributionCycle > 0n) {
              const funderReward = BigInt(this.solution?.funderReward);
              if (funderReward && percentScale > funderReward) {
                contribution =
                  (contributionAfterFees * percentScale) /
                  (percentScale - funderReward);
              }
            }

            const position: SolutionPosition = {
              contribution,
              contributionAfterFees,
              feesEarned,
              refundable,
              positionIndex,
            };

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

  private renderDrafter() {
    const profile = parseProfile(this.solution!.drafter.profile);
    const id = this.solution!.drafter.id;
    const displayName = profile.name || profile.team || id;
    return html`
      <a class="drafter" href="/profile/${id}">
        <user-avatar .address=${id} .image=${profile.image}></user-avatar>
        <span>${displayName}</span>
      </a>
    `;
  }

  private renderPositions() {
    const position = this.positions[this.positionIndex];
    let positionTitle = 'Your Position';
    if (this.positions.length > 1) {
      positionTitle += 's';
    }
    return html`
      <div class="user-positions">
        <div class="positions-header">
          <h3>${positionTitle}</h3>
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
              ${formatAmount(position.contribution)}
              ${this.fundInput?.tokenSymbol}
            </strong>
            (${formatAmount(position.contributionAfterFees)} after fees
            <sl-tooltip
              content="You paid ${formatAmount(
                position.contribution - position.contributionAfterFees
              )} in Funder Reward fees to previous funders."
            >
              <span class="info-icon">ℹ️</span>
            </sl-tooltip>
            )
          </p>
          <p>
            Fees earned:
            <strong>
              ${formatAmount(position.feesEarned)}
              ${this.fundInput?.tokenSymbol}
            </strong>
          </p>
          ${position.refundable
            ? html` <p>
                <strong>Goal Failed:</strong> You can refund your contribution.
              </p>`
            : html``}
          <div class="button-row">
            ${position.refundable
              ? html`
                  <sl-button variant="primary" @click=${this.handleRefund}>
                    Refund Position
                  </sl-button>
                `
              : html``}
            ${position.feesEarned > 0n
              ? html`
                  <div class="item-with-tooltip">
                    <sl-button
                      variant="primary"
                      @click=${this.handleCollectFees}
                    >
                      Collect Fees
                    </sl-button>
                    <sl-tooltip
                      content="These are 🎁 funder rewards you earned from funders making contributions after yours."
                    >
                      <span class="info-icon">ℹ️</span>
                    </sl-tooltip>
                  </div>
                `
              : html``}
            <transaction-watcher
              class="refund"
              @transaction-success=${this.handleRefundSuccess}
            ></transaction-watcher>
            <transaction-watcher
              class="collect"
              @transaction-success=${this.handleCollectSuccess}
            ></transaction-watcher>
          </div>
        </div>
      </div>
    `;
  }

  private renderSolutionStats() {
    const progress = calculateProgress(this.solution);
    const deadline = formatDate(this.solution!.deadline, 'full');
    const totalStake = formatAmount(this.solution!.stake);
    const fundingTokenSymbol = this.fundInput?.tokenSymbol;

    return html`
      <div class="stat-row">
        <span class="stat-label">Progress:</span>
        <div class="progress-container">
          <sl-progress-bar
            class="progress-bar"
            value="${progress}"
          ></sl-progress-bar>
          <span
            >🚀 <strong>${progress.toFixed(0)}%</strong> complete
            (${formatAmount(this.solution!.tokensContributed)} /
            ${formatAmount(this.solution!.fundingGoal)}
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
        <div class="item-with-tooltip">
          <span>💎 ${totalStake} UPD</span>
          <sl-tooltip
            content="💎 Stake is divided among funders if a Solution's funding goal isn't reached by the deadline. Contributions are also refunded minus any funder reward fees."
          >
            <span class="info-icon">ℹ️</span>
          </sl-tooltip>
        </div>
      </div>
      <div class="stat-row">
        <span class="stat-label">Funder Reward:</span>
        <div class="item-with-tooltip">
          <span>🎁 ${formatReward(this.solution!.funderReward)}</span>
          <sl-tooltip
            content="This is the percentage of each contribution that is paid to previous contributors. You can collect your 🎁 funder rewards for a Solution after new contributions are made."
          >
            <span class="info-icon">ℹ️</span>
          </sl-tooltip>
        </div>
      </div>
    `;
  }

  private get isDrafter() {
    return (
      userAddress.get()?.toLowerCase() ===
      this.solution?.drafter.id.toLowerCase()
    );
  }

  private get withdrawalStatus() {
    if (!this.solution) return '';

    const contributed = this.solution.tokensContributed;
    const withdrawn = this.tokensWithdrawn;
    const tokenSymbol = this.fundInput?.tokenSymbol || '';

    return `${formatAmount(withdrawn)} of ${formatAmount(contributed)} ${tokenSymbol} withdrawn`;
  }

  private handleFormSubmit(e: Event) {
    e.preventDefault();
  }

  private async handleRefund() {
    try {
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

  private async handleRemoveStake() {
    try {
      const stake = this.userStakeTask.value;
      if (!stake) {
        console.warn('No stake to remove');
        return;
      }

      const solutionContract = new SolutionContract(this.solutionId);
      this.removeStakeTransaction.reset();
      this.removeStakeTransaction.hash = await solutionContract.write(
        'removeStake',
        [
          stake, // Remove the entire stake
        ]
      );
    } catch (err) {
      console.error('Remove stake error:', err);
      if (err instanceof Error && err.message.startsWith('connection')) {
        modal.open({ view: 'Connect' });
      }
    }
  }

  private handleRemoveStakeSuccess() {
    // Refresh user stake after successful stake removal
    this.userStakeTask.run();
  }

  private async handleWithdrawFunds() {
    try {
      const solutionContract = new SolutionContract(this.solutionId);
      this.withdrawFundsTransaction.reset();
      this.withdrawFundsTransaction.hash =
        await solutionContract.write('withdrawFunds');
    } catch (err) {
      console.error('Withdraw funds error:', err);
      if (err instanceof Error && err.message.startsWith('connection')) {
        modal.open({ view: 'Connect' });
      }
    }
  }

  private handleWithdrawFundsSuccess() {
    // Refresh solution data after successful withdrawal
    this.solutionController.refresh();
    // Also refresh the tokens withdrawn amount
    this.withdrawnTokensTask.run();
  }

  private readonly withdrawnTokensTask = new Task(
    this,
    async ([solutionId, isDrafter]) => {
      if (solutionId && isDrafter) {
        try {
          const solutionContract = new SolutionContract(solutionId);
          // Get tokens withdrawn from the contract
          const withdrawn = (await solutionContract.read(
            'tokensWithdrawn'
          )) as bigint;
          this.tokensWithdrawn = withdrawn;
          return withdrawn;
        } catch (error) {
          console.warn('Error fetching tokens withdrawn:', error);
        }
      }
      return 0n;
    },
    () => [this.solutionId, this.isDrafter] as const
  );

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

  disconnectedCallback() {
    super.disconnectedCallback();
    // Clear social media meta tags when leaving the page
    resetMetaTags();
  }

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    // Update controller variables if solutionId changes
    if (changedProperties.has('solutionId') && this.solutionId) {
      this.loaded = false;
      this.error = null; // Clear previous errors
      this.positions = []; // Clear previous positions
      this.tokensWithdrawn = 0n; // Reset tokens withdrawn
      this.solutionController.setVariablesAndSubscribe({
        solutionId: this.solutionId,
      });
    }
  }

  render() {
    if (this.solution) {
      return cache(html`
        <main>
          <div class="header-container">
            <div class="top-row">
              <div class="title-area">
                <h1>${this.solutionInfo?.name || 'Untitled Solution'}</h1>
                <div class="idea-link">
                  Solution for Idea:
                  <a
                    href="/idea/${this.solution.idea?.id}"
                    title="View linked Idea"
                    >${this.solution.idea?.name || 'Unknown Idea'}</a
                  >
                </div>
              </div>
              ${this.isDrafter
                ? html`
                    <sl-button
                      class="edit-button"
                      pill
                      size="medium"
                      href="/edit-solution/${this.solutionId}?tokenSymbol=${this
                        .fundInput?.tokenSymbol || 'tokens'}"
                      >Edit
                    </sl-button>
                  `
                : html``}
            </div>
            ${this.renderDrafter()}
          </div>
          ${goalReached(this.solution) && this.isDrafter
            ? html`
                <div class="goal-reached">
                  <p>
                    <strong>Goal Reached!</strong>
                    As the drafter, you can now withdraw the funds.
                  </p>
                  <div class="withdraw-funds-row">
                    <sl-button
                      variant="success"
                      @click=${this.handleWithdrawFunds}
                    >
                      Withdraw Funds
                    </sl-button>
                    <span class="withdrawal-status"
                      >${this.withdrawalStatus}</span
                    >
                    <transaction-watcher
                      class="withdraw-funds"
                      @transaction-success=${this.handleWithdrawFundsSuccess}
                    ></transaction-watcher>
                  </div>
                </div>
              `
            : html``}
          ${goalFailed(this.solution)
            ? html`
                <div class="goal-failed">
                  <p>
                    <strong>❌ Goal Failed!</strong>
                    Funders can get a refund and part of the stake.
                  </p>
                </div>
              `
            : html``}
          <div class="solution-stats">${this.renderSolutionStats()}</div>
          ${this.userStakeTask.render({
            complete: (stake) => {
              if (stake) {
                return html`
                  <div class="user-stake">
                    <div class="positions-header">
                      <h3>Your Stake</h3>
                    </div>
                    <div class="position-details">
                      <p>
                        You staked
                        <strong> ${formatAmount(stake)} UPD </strong>
                        in this solution.
                      </p>
                      ${goalReached(this.solution)
                        ? html`
                            <p>
                              <strong>Goal Reached:</strong> You can now remove
                              your stake.
                            </p>
                            <sl-button
                              variant="primary"
                              @click=${this.handleRemoveStake}
                            >
                              Remove Stake
                            </sl-button>
                            <transaction-watcher
                              class="remove-stake"
                              @transaction-success=${this
                                .handleRemoveStakeSuccess}
                            ></transaction-watcher>
                          `
                        : html``}
                    </div>
                  </div>
                `;
              }
              return html``;
            },
          })}
          ${this.userPositionsTask.render({
            complete: () =>
              this.positions.length > 0 ? this.renderPositions() : html``,
          })}
          <div class="action-buttons">
            ${!goalFailed(this.solution)
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
                              Fund Solution
                            </sl-button>
                          `}
                      <div class="item-with-tooltip" slot="valid">
                        <sl-button variant="success" @click=${this.handleFund}>
                          Fund Solution
                        </sl-button>
                        <sl-tooltip
                          content="Part of your funding goes to the Solution fund to help this Solution reach its goal and part goes to 🎁 Funder Rewards for past funders. The percentage was set by the Solution drafter."
                        >
                          <span class="info-icon">ℹ️</span>
                        </sl-tooltip>
                      </div>
                    </token-input>
                    <transaction-watcher
                      class="fund"
                      @transaction-success=${this.handleFundSuccess}
                    ></transaction-watcher>
                  </form>
                `
              : html``}
            ${!goalFailed(this.solution) && !goalReached(this.solution)
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
                      <div class="item-with-tooltip" slot="valid">
                        <sl-button variant="primary" @click=${this.handleStake}>
                          Add Stake
                        </sl-button>
                        <sl-tooltip
                          content="Adding a 💎 stake adds an incentive for funders because they earn part of the stake if the funding goal fails. If the funding goal succeeds, you  get your stake back; otherwise, your stake is divided among funders."
                        >
                          <span class="info-icon">ℹ️</span>
                        </sl-tooltip>
                      </div>
                    </token-input>
                    <transaction-watcher
                      class="stake"
                      @transaction-success=${this.handleStakeSuccess}
                    ></transaction-watcher>
                  </form>
                `
              : html``}
          </div>

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
        </main>
        <upd-dialog></upd-dialog>
        <share-dialog></share-dialog>
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
            <sl-button href="/discover?tab=solutions" variant="primary">
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
