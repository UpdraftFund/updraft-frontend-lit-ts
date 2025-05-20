import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';
import '@shoelace-style/shoelace/dist/components/badge/badge.js';

import { formatAmount, formatDate, formatReward } from '@utils/format-utils';
import {
  calculateProgress,
  goalFailed,
  goalReached,
} from '@utils/solution/solution-utils';

import { Solution } from '@/types';

@customElement('solution-details-bar')
export class SolutionDetailsBar extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      margin-top: 1rem;
    }

    .goal {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .goal-text {
      font-size: 0.75rem;
      color: var(--sl-color-neutral-600);
    }

    sl-progress-bar {
      --height: 8px;
    }

    .emoji-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.875rem;
    }

    .emoji {
      font-size: 1rem;
      padding: 0.125rem;
    }
  `;

  @property({ type: Object }) solution!: Solution;

  render() {
    return html`
      <div class="goal">
        <sl-progress-bar
          value="${calculateProgress(this.solution)}"
        ></sl-progress-bar>
        <div class="goal-text">
          ${formatAmount(this.solution.tokensContributed)} out of
          ${formatAmount(this.solution.fundingGoal)}
        </div>
      </div>
      ${goalReached(this.solution)
        ? html`<span class="emoji-badge">
            <span class="emoji">✅</span>Reached
          </span>`
        : html``}
      ${goalFailed(this.solution)
        ? html`<span class="emoji-badge">
            <span class="emoji">❌</span>Failed
          </span>`
        : html``}
      <span class="emoji-badge"
        ><span class="emoji">⏰</span>${formatDate(
          this.solution.deadline,
          'fromNow'
        )}</span
      >
      <span class="emoji-badge"
        ><span class="emoji">💎</span>${formatAmount(this.solution.stake)}</span
      >
      <span class="emoji-badge"
        ><span class="emoji">🎁</span>${formatReward(
          this.solution.funderReward
        )}</span
      >
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'solution-details-bar': SolutionDetailsBar;
  }
}
