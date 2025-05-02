import { customElement } from 'lit/decorators.js';
import { html, css } from 'lit';
import { GoalFailed } from '@pages/home/types';
import { TrackedChangeCard } from './tracked-change-card';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { fromHex } from 'viem';
import { SolutionInfo } from '@/features/solution/types';

dayjs.extend(relativeTime);

@customElement('goal-failed-card')
export class GoalFailedCard extends TrackedChangeCard {
  static styles = [
    ...TrackedChangeCard.styles,
    css`
      /* Additional styles specific to this card */
    `,
  ];

  // Type checking for the change property
  declare change: GoalFailed;

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

    return html`
      <sl-card>
        <div slot="header">
          <a class="change-card-heading">
            href="/solution/${solution.id}"> ${solutionInfo?.name || 'Solution'}
          </a>
          <div class="change-card-subheading">Goal Failed</div>
        </div>

        <div class="emoji-large">😔</div>

        <div class="success-message">
          Funding goal was not met by the deadline
        </div>

        <div class="funding-details">
          ${this.formatAmount(solution?.tokensContributed)} of
          ${this.formatAmount(solution?.fundingGoal)} UPD raised
        </div>

        <div slot="footer">${dayjs(this.change.time).fromNow()}</div>
      </sl-card>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'goal-failed-card': GoalFailedCard;
  }
}
