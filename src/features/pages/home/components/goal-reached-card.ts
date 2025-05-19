import { customElement, property } from 'lit/decorators.js';
import { html, css, LitElement } from 'lit';
import { fromHex } from 'viem';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import { GoalReached } from '@pages/home/types';
import { SolutionInfo } from '@/features/solution/types';
import { formatAmount } from '@utils/format-utils';

import '@shoelace-style/shoelace/dist/components/card/card.js';

import { changeCardStyles } from '@styles/change-card-styles';

@customElement('goal-reached-card')
export class GoalReachedCard extends LitElement {
  static styles = [
    changeCardStyles,
    css`
      /* Additional styles specific to this card */
    `,
  ];

  @property({ type: Object }) change!: GoalReached;

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
          <a class="change-card-heading" href="/solution/${solution.id}">
            ${solutionInfo?.name || 'Solution'}
          </a>
          <div class="change-card-subheading">Goal Reached! 🎉</div>
        </div>
        <div class="goal-message">Funding goal has been reached!</div>
        <div class="funding-details">
          ${formatAmount(solution.tokensContributed)} raised
        </div>
        <div slot="footer">${dayjs(this.change.time).fromNow()}</div>
      </sl-card>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'goal-reached-card': GoalReachedCard;
  }
}
