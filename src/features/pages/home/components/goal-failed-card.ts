import { customElement, query } from 'lit/decorators.js';
import { html, css } from 'lit';
import { Task } from '@lit/task';
import { fromHex } from 'viem';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

import { TransactionWatcher } from '@components/common/transaction-watcher';
import { TrackedChangeCard } from './tracked-change-card';
import { GoalFailed } from '@pages/home/types';
import { SolutionContract } from '@contracts/solution';
import { Solution, SolutionInfo } from '@/features/solution/types';

import { userAddress } from '@state/user';

import { formatAmount, calculateProgress } from '@utils/format-utils';

@customElement('goal-failed-card')
export class GoalFailedCard extends TrackedChangeCard {
  static styles = [
    ...TrackedChangeCard.styles,
    css`
      /* Additional styles specific to this card */
      .refund-button {
        margin-top: 1rem;
      }

      .refund-section {
        margin-top: 1rem;
      }
    `,
  ];

  // Type checking for the change property
  declare change: GoalFailed;

  @query('transaction-watcher') refundTransaction!: TransactionWatcher;

  private readonly hasFundedTask = new Task(
    this,
    async ([solutionAddress, userAddr]) => {
      if (!solutionAddress || !userAddr) return false;

      try {
        const solution = new SolutionContract(solutionAddress as `0x${string}`);
        // Check if the user has any positions in this solution
        const numPositions = await solution.read('numPositions', [userAddr]);
        return Number(numPositions) > 0;
      } catch (error) {
        console.error('Error checking if user funded solution:', error);
        return false;
      }
    },
    () => [this.change.solution.id, userAddress.get()] as const
  );

  private async handleRefund() {
    try {
      const solution = new SolutionContract(
        this.change.solution.id as `0x${string}`
      );
      // Call the refund function without parameters to refund all positions
      this.refundTransaction.hash = await solution.write('refund', []);
    } catch (error) {
      console.error('Error refunding solution:', error);
    }
  }

  render() {
    const solution = this.change.solution;

    let solutionInfo: SolutionInfo | null = null;
    if (solution?.info) {
      try {
        solutionInfo = JSON.parse(
          fromHex(solution.info as `0x${string}`, 'string')
        );
      } catch (e) {
        console.error('Error parsing solution info', e);
      }
    }

    const progress = calculateProgress(solution as Solution);

    return html`
      <sl-card>
        <div slot="header">
          <a class="change-card-heading" href="/solution/${solution.id}"
            >${solutionInfo?.name || 'Solution'}
          </a>
          <div class="change-card-subheading">Goal Failed</div>
        </div>

        <div class="emoji-large">😔</div>
        <p class="goal-message">Funding goal was not met by the deadline</p>

        <div class="goal">
          <sl-progress-bar value="${Math.min(progress, 100)}"></sl-progress-bar>
          <div class="goal-text">
            ${formatAmount(solution.tokensContributed)} out of
            ${formatAmount(solution.fundingGoal)} UPD
          </div>
        </div>

        <div slot="footer">${dayjs(this.change.time).fromNow()}</div>

        ${this.hasFundedTask.render({
          pending: () =>
            html` <div class="refund-section">
              <sl-spinner></sl-spinner>
              Checking funding status...
            </div>`,
          complete: (hasFunded) =>
            hasFunded
              ? html`
                  <div class="refund-section">
                    <p>
                      You funded this solution. You can get a refund since the
                      goal was not met.
                    </p>
                    <sl-button
                      class="refund-button"
                      variant="primary"
                      @click=${this.handleRefund}
                    >
                      Get refunded
                    </sl-button>
                    <transaction-watcher
                      @transaction-success=${() => this.hasFundedTask.run()}
                    ></transaction-watcher>
                  </div>
                `
              : html``,
          error: (error) =>
            html` <div class="refund-section">
              Error checking funding status: ${(error as Error).message}
            </div>`,
        })}
      </sl-card>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'goal-failed-card': GoalFailedCard;
  }
}
