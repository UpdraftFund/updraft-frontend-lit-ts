import { customElement, property } from 'lit/decorators.js';
import { html, css, LitElement } from 'lit';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import { GoalReached } from '@pages/home/types';
import { formatAmount } from '@utils/format-utils';
import { parseSolutionInfo } from '@utils/solution/solution-utils';

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
    const solutionInfo = parseSolutionInfo(solution?.info);

    return html`
      <sl-card>
        <div slot="header">
          <a class="change-card-heading" href="/solution/${solution.id}"> ${solutionInfo?.name || 'Solution'} </a>
          <div class="change-card-subheading">Goal Reached! 🎉</div>
        </div>
        <div class="goal-message">Funding goal has been reached!</div>
        <div class="funding-details">${formatAmount(solution.tokensContributed)} raised</div>
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
