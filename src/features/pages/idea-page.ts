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
import '@components/navigation/create-idea-button';
import '@components/navigation/search-bar';
import '@components/idea/top-supporters';
import '@components/idea/related-ideas';
import '@components/idea/idea-solutions';
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
import { formatAmount, formatDate } from '@utils/format-utils';
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
      :host {
        flex: 1;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        padding: 1rem 1rem 1rem 2rem;
      }
      .support {
        display: flex;
        flex-direction: column;
        margin-bottom: 1rem;
      }
      .airdrop-option {
        display: flex;
        align-items: flex-end;
        gap: 0.5rem;
        margin-left: 0.25rem;
      }
      .info-icon {
        font-size: 0.75rem;
        cursor: help;
      }
      .heading {
        font-size: var(--sl-font-size-2x-large);
        margin-bottom: 0;
      }
      .creator {
        display: flex;
        align-items: center;
        gap: var(--sl-spacing-small);
        width: fit-content;
        padding-top: 0.75rem;
      }
      .created {
        font-size: 0.9rem;
        margin-top: 0.4rem;
        margin-bottom: 0.4rem;
      }
      .idea-info {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin: 1rem 0 0;
      }
      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }
      .tag {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        background-color: var(--subtle-background);
        border-radius: 1rem;
        font-size: 0.875rem;
        text-decoration: none;
        color: var(--main-foreground);
      }
      .tag:hover {
        background-color: var(--accent);
        color: var(--sl-color-neutral-0);
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
      sl-dialog::part(body) {
        padding-top: 0;
      }
      .your-support {
        background-color: var(--subtle-background);
        border-radius: 0.5rem;
        padding: 1rem;
        margin: 1rem 0;
        max-width: 500px;
      }
      .support-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }
      .your-support h3 {
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
      .support-details {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .support-details p {
        margin: 0;
      }
      .support-details sl-button {
        margin-top: 0.5rem;
        align-self: flex-start;
      }
      .solutions-header {
        display: flex;
        gap: 1rem;
        align-items: center;
        margin: 1rem 0;
      }
      .solutions-header h2 {
        margin: 0;
        font-size: 2rem;
        font-weight: 700;
      }
      .solutions-header sl-button {
        padding-top: 0.2rem;
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
      const {
        startTime,
        funderReward,
        shares,
        creator,
        tags,
        description,
        name,
      } = this.idea;

      const pctFunderReward =
        (funderReward * 100) / updraftSettings.get().percentScale;

      const profile = JSON.parse(
        fromHex(creator.profile as `0x${string}`, 'string')
      );

      const displayName = profile.name || profile.team || creator.id;

      return cache(html`
        <h1 class="heading">Idea: ${name}</h1>
        <a class="creator" href="/profile/${creator.id}">
          <user-avatar
            .address=${creator.id}
            .image=${profile.image}
          ></user-avatar>
          <span>${displayName}</span>
        </a>
        <span class="created"> Created ${formatDate(startTime, 'full')} </span>
        <div class="idea-info">
          ${pctFunderReward
            ? html`
                <span> 🎁 ${pctFunderReward.toFixed(0)}% funder reward </span>
              `
            : html``}
          <span>🔥 ${formatAmount(shares)}</span>
        </div>
        <div class="description-tags">
          <h3>Description</h3>
          <p>${description}</p>
          ${tags
            ? html`
                <div class="tags">
                  ${tags.map(
                    (tag) => html`
                      <a href="/discover?search=[${tag}]" class="tag">${tag}</a>
                    `
                  )}
                </div>
              `
            : html``}
        </div>
        ${this.userSupportTask.render({
          complete: () => {
            // Check if we have any positions
            if (this.positions.length > 0) {
              const position = this.positions[this.positionIndex];

              return html`
                <div class="your-support">
                  <div class="support-header">
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
                  <div class="support-details">
                    <p>
                      Your contribution:
                      <strong>
                        ${formatAmount(position.originalContribution)} UPD
                      </strong>
                      <small
                        >including ${formatAmount(position.feesPaid)} UPD in
                        fees</small
                      >
                    </p>
                    <p>
                      Your earnings so far:
                      <strong> ${formatAmount(position.earnings)} UPD </strong>
                    </p>
                    <p>
                      Withdrawable amount:
                      <strong>
                        ${formatAmount(position.currentPosition)} UPD
                      </strong>
                    </p>
                    <sl-button variant="primary" @click=${this.handleWithdraw}>
                      Withdraw Support
                    </sl-button>
                  </div>
                  <transaction-watcher
                    class="withdraw"
                    @transaction-success=${this.handleWithdrawSuccess}
                  >
                  </transaction-watcher>
                </div>
                <h3>Add More Support</h3>
              `;
            } else {
              return html`<h3>Support this Idea</h3>`;
            }
          },
        })}
        <form @submit=${this.handleSubmit}>
          <div class="support">
            <token-input
              name="support"
              required
              spendingContract=${this.ideaId}
              spendingContractName=${this.idea.name}
              antiSpamFeeMode="variable"
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
                ${this.isAirdropMode ? 'Airdrop' : 'Support this Idea'}
              </sl-button>
            </token-input>
            <transaction-watcher
              class="submit"
              @transaction-success=${this.handleSupportSucces}
            >
            </transaction-watcher>
            <div class="airdrop-option">
              <sl-checkbox name="airdrop" @sl-change=${this.updateAirdropMode}
                >Airdrop to past contributors
              </sl-checkbox>
              <sl-tooltip
                content="An airdrop uses 100% of its funds to reward past contributors and increase 🔥."
              >
                <span class="info-icon">ℹ️</span>
              </sl-tooltip>
            </div>
          </div>
        </form>
        <div class="solutions-header">
          <h2>Solutions</h2>
          <sl-button href="/create-solution/${this.ideaId}">
            <sl-icon slot="prefix" src=${plusLgIcon}></sl-icon>
            Add Solution
          </sl-button>
        </div>
        <idea-solutions .ideaId=${this.ideaId}></idea-solutions>

        <share-dialog
          action=${this.isAirdropMode
            ? 'airdropped to an Idea'
            : 'supported an Idea'}
          .topic=${name}
        ></share-dialog>
      `);
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
            <sl-button href="/discover" variant="primary"
              >Browse Ideas
            </sl-button>
          </div>
        `;
      } else {
        return html` <sl-spinner></sl-spinner>`;
      }
    }
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
      <sl-dialog label="Set Allowance">
        <p>
          Before you can support this Idea, you need to sign a transaction to
          allow the Idea contract to spend your UPD tokens.
        </p>
        <transaction-watcher
          class="approve"
          @transaction-success=${this.handleSubmit}
        ></transaction-watcher>
      </sl-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'idea-page': IdeaPage;
  }
}
