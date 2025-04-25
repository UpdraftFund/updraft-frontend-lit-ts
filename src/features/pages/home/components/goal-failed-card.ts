import { customElement } from 'lit/decorators.js';
import { html } from 'lit';
import { css } from 'lit';
import { GoalFailed } from '@pages/home/types';
import { TrackedChangeCard } from './tracked-change-card';

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

    return html`
      <sl-card>
        <div slot="header">
          <h3 class="change-card-title">${solution?.info || 'Solution'}</h3>
          <div class="change-card-byline">Goal Failed</div>
        </div>

        <div class="emoji-large">😔</div>

        <div class="success-message">
          Funding goal was not met by the deadline
        </div>

        <div class="funding-details">
          ${this.formatAmount(solution?.tokensContributed)} of
          ${this.formatAmount(solution?.fundingGoal)} UPD raised
        </div>

        ${solution ? this.renderSolutionDetails(solution) : ''}
      </sl-card>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'goal-failed-card': GoalFailedCard;
  }
}
