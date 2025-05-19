import { customElement, query, property } from 'lit/decorators.js';
import { html, css, LitElement } from 'lit';
import { Task } from '@lit/task';
import { fromHex } from 'viem';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';

import { TransactionWatcher } from '@components/common/transaction-watcher';
import { GoalFailed } from '@pages/home/types';
import { SolutionContract } from '@contracts/solution';
import { Solution, SolutionInfo } from '@/features/solution/types';

import { userAddress } from '@state/user';

import { formatAmount } from '@utils/format-utils';
import { calculateProgress } from '@utils/solution/solution-utils';

import { changeCardStyles } from '@styles/change-card-styles';

@customElement('goal-failed-card')
export class GoalFailedCard extends LitElement {
  static styles = [
    changeCardStyles,
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

  @property({ type: Object }) change!: GoalFailed;

  @query('transaction-watcher') refundTransaction!: TransactionWatcher;

  private readonly hasFundedTask = new Task(
    this,
    async ([solutionAddress, userAddr]) => {
      if (!solutionAddress || !userAddr) return false;

      try {
        const solution = new SolutionContract(solutionAddress as `0x${string}`);
        // Check if the user has a single, unrefunded position greater than zero
        const [contribution, , , refunded] = (await solution.read(
          'positionsByAddress',
          [userAddr, 0]
        )) as bigint[];
        return contribution > 0n && !refunded;
      } catch (error) {
        console.warn('Error checking if user funded solution:', error);
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
      // This works if there's only one position.
      this.refundTransaction.hash = await solution.write('refund', []);
    } catch (error) {
      console.warn('Error refunding solution:', error);
      // Navigate to the solution page instead. This might allow the user to refund multiple positions one-by-one.
      window.location.href = `/solution/${this.change.solution.id}`;
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
          <div class="change-card-subheading">Goal Failed 😔</div>
        </div>
        <p class="goal-message">Funding goal was not met by the deadline</p>
        <div class="goal">
          <sl-progress-bar value="${progress}"></sl-progress-bar>
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
