import { customElement, property, query, state } from 'lit/decorators.js';
import { css, LitElement } from 'lit';
import { html, SignalWatcher } from '@lit-labs/signals';
import { cache } from 'lit/directives/cache.js';
import { Task } from '@lit/task';

import { fromHex, formatUnits, parseUnits } from 'viem';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';

import chevronLeft from '@icons/navigation/chevron-left.svg';
import chevronRight from '@icons/navigation/chevron-right.svg';

dayjs.extend(relativeTime);
dayjs.extend(utc);

import { dialogStyles } from '@styles/dialog-styles';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import { SlDialog, SlInput } from '@shoelace-style/shoelace';

import '@components/navigation/create-idea-button';
import '@components/navigation/search-bar';
import '@components/idea/top-supporters';
import '@components/idea/related-ideas';
import '@components/idea/idea-solutions';
import '@components/common/token-input';
import '@components/common/upd-dialog';
import '@components/common/share-dialog';
import '@components/common/transaction-watcher';
import { UpdDialog } from '@components/common/upd-dialog';
import { ShareDialog } from '@components/common/share-dialog';
import { TransactionWatcher } from '@components/common/transaction-watcher';
import { TokenInput } from '@components/common/token-input';

import { shortNum } from '@utils/short-num';
import { modal } from '@utils/web3';
import { UrqlQueryController } from '@utils/urql-query-controller';

import { Idea, IdeaDocument } from '@gql';
import { IdeaContract } from '@contracts/idea';
import type { Position } from '@/features/idea/types';

import { updraftSettings } from '@state/common';
import layout from '@state/layout';
import { markComplete } from '@state/user/beginner-tasks';
import { userAddress } from '@state/user';

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
        padding: 0.5rem 1rem;
        color: var(--main-foreground);
        background: var(--main-background);
      }

      .support {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-top: 0.25rem;
      }

      .heading {
        font-size: 1.9rem;
        font-weight: 500;
        margin-bottom: 0;
      }

      .created {
        font-size: 0.9rem;
        margin-top: 0.4rem;
      }

      .reward-fire {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin: 1rem 0;
      }

      .reward-fire span {
        display: flex;
        gap: 0.3rem;
      }

      .fire {
        align-items: center;
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

      .user-support {
        background-color: var(--subtle-background);
        border-radius: 0.5rem;
        padding: 1rem;
        margin: 1rem 0;
      }

      .support-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }

      .user-support h3 {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 500;
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
        margin: 1rem 0 0;
      }

      .solutions-header h2 {
        margin: 0;
        font-size: 1.875rem;
        font-weight: 500;
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
  @query('sl-input[name="support"]', true) supportInput!: SlInput;
  @query('token-input', true) tokenInput!: TokenInput;

  // supportValue is now handled by UpdTransactionMixin as updValue
  @state() private idea?: Idea;
  @state() private error: string | null = null;
  @state() private loaded: boolean = false;
  // Track current position index for navigation
  @state() private positionIndex: number = 0;
  // Track low balance status
  @state() private isLowBalance: boolean = false;

  private positions: Position[] = [];

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

        // First, get the total number of positions
        const numPositions = (await idea.read('numPositions', [
          address,
        ])) as bigint;

        // If user has no positions, return null
        if (numPositions === 0n) {
          this.positions = [];
          return null;
        }

        // Collect all viable positions
        const viablePositions: Position[] = [];

        // Check each position
        for (let i = 0n; i < numPositions; i++) {
          try {
            // Get current position (includes original contribution + earnings)
            const position = (await idea.read('checkPosition', [
              address,
              i,
            ])) as bigint[];
            const currentPosition = position[0] as bigint;

            // Skip positions with zero value (already withdrawn)
            if (currentPosition <= 0n) continue;

            // Get original contribution from positionsByAddress mapping
            const originalPosition = (await idea.read('positionsByAddress', [
              address,
              i,
            ])) as bigint[];

            const originalContribution = originalPosition[1] as bigint;

            // Skip positions with zero value (already withdrawn)
            if (originalContribution <= 0n) continue;

            const earnings = currentPosition - originalContribution;
            viablePositions.push({
              originalContribution,
              currentPosition,
              earnings,
              positionIndex: i,
            });
          } catch (error) {
            // If position doesn't exist (already withdrawn), skip it
            console.warn(`Position ${i} not available:`, error);
          }
        }

        // Store the viable positions and reset current index
        this.positions = viablePositions;
        this.positionIndex = viablePositions.length > 0 ? 0 : -1;

        // Return the positions array for rendering
        return viablePositions.length > 0 ? viablePositions : null;
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
      if (this.positions.length === 0 || this.positionIndex < 0) {
        console.warn('No valid position to withdraw');
        return;
      }

      const currentPosition = this.positions[this.positionIndex];
      const idea = new IdeaContract(this.ideaId);

      this.withdrawTransaction.hash = await idea.write('withdraw', [
        currentPosition.positionIndex,
      ]);
    } catch (e) {
      // Use token-input's error handling
      if (this.tokenInput) {
        this.tokenInput.handleTransactionError(
          e,
          undefined, // No approval callback needed for withdraw
          () => this.updDialog.show() // Show UPD dialog on low balance
        );
      } else {
        console.error('Withdraw error:', e);
        if (e instanceof Error && e.message.startsWith('connection')) {
          modal.open({ view: 'Connect' });
        }
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

  private async handleSubmit(e: Event) {
    e.preventDefault();
    if (this.form.checkValidity()) {
      if (!this.tokenInput || this.tokenInput.error || this.isLowBalance) {
        return;
      }

      const support = parseUnits(this.tokenInput.value, 18);
      this.submitTransaction.reset();

      try {
        const idea = new IdeaContract(this.ideaId);
        this.submitTransaction.hash = await idea.write('contribute', [support]);
      } catch (err) {
        this.tokenInput.handleTransactionError(
          err,
          () => this.handleSubmit(e), // Retry after approval
          () => this.updDialog.show() // Show UPD dialog on low balance
        );
      }
    } else {
      this.form.reportValidity(); // Show validation messages
    }
  }

  private async handleSupportSucces() {
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
      const date = dayjs(startTime * 1000);
      const interest = shortNum(formatUnits(shares, 18));

      return cache(html`
        <h1 class="heading">Idea: ${name}</h1>
        <a href="/profile/${creator.id}">by ${profile.name || creator.id}</a>
        <span class="created">
          Created ${date.format('MMM D, YYYY [at] h:mm A UTC')}
          (${date.fromNow()})
        </span>
        <div class="reward-fire">
          ${pctFunderReward
            ? html`
                <span class="reward">
                  🎁 ${pctFunderReward.toFixed(0)}% funder reward
                </span>
              `
            : html``}
          <span class="fire">🔥${interest}</span>
        </div>
        ${this.userSupportTask.render({
          complete: () => {
            // Check if we have any positions
            if (this.positions.length > 0 && this.positionIndex >= 0) {
              const position = this.positions[this.positionIndex];

              return html`
                <div class="user-support">
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
                      Your original contribution:
                      <strong>
                        ${shortNum(
                          formatUnits(position.originalContribution, 18)
                        )}
                        UPD
                      </strong>
                    </p>
                    <p>
                      Your earnings so far:
                      <strong>
                        ${shortNum(formatUnits(position.earnings, 18))} UPD
                      </strong>
                    </p>
                    <p>
                      Withdrawable amount:
                      <strong>
                        ${shortNum(formatUnits(position.currentPosition, 18))}
                        UPD
                      </strong>
                    </p>
                    <sl-button variant="primary" @click=${this.handleWithdraw}>
                      Withdraw Support
                    </sl-button>
                  </div>
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
              spendingContractName="This Idea"
              antiSpamFeeMode="variable"
              showDialogs="false"
              @low-balance=${() => {
                this.isLowBalance = true;
              }}
            >
              <sl-button
                slot="low-balance"
                variant="primary"
                @click=${() => this.updDialog.show()}
              >
                Get more UPD
              </sl-button>
              <sl-button
                slot="sufficient-balance"
                variant="primary"
                type="submit"
              >
                Support this Idea
              </sl-button>
            </token-input>
          </div>
        </form>
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

        <div class="solutions-header">
          <h2>Solutions</h2>
          <sl-button
            class="add-solution-button"
            href="/create-solution/${this.ideaId}"
            variant="primary"
            >Add Solution
          </sl-button>
        </div>
        <idea-solutions .ideaId=${this.ideaId}></idea-solutions>

        <share-dialog action="supported an Idea" .topic=${name}></share-dialog>
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

    this.updateComplete.then(() => {
      this.addEventListener('low-balance', () => {
        this.isLowBalance = true;
      });
    });
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
      <transaction-watcher
        class="submit"
        @transaction-success=${this.handleSupportSucces}
      >
      </transaction-watcher>
      <transaction-watcher
        class="withdraw"
        @transaction-success=${this.handleWithdrawSuccess}
      >
      </transaction-watcher>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'idea-page': IdeaPage;
  }
}
