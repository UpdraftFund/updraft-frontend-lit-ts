import { html, css, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import dayjs from 'dayjs';

import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';

import {
  formatAmount,
  formatReward,
  calculateProgress,
} from '@utils/format-utils';
import { Change, Solution } from '@/types';
import { SolutionFieldsFragment, SolutionFieldsDetailedFragment } from '@gql';

export class TrackedChangeCard extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
        height: 100%;
        width: 100%;
      }

      sl-card {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
      }

      .change-card-heading,
      .new-solution-heading,
      .solution-body {
        text-decoration: none;
        color: var(--main-foreground);
      }

      .change-card-heading:hover,
      .new-solution-heading:hover {
        color: var(--link);
        text-decoration: underline;
      }

      .change-card-heading {
        font-size: 1.25rem;
        font-weight: 600;
      }

      .change-card-subheading {
        font-size: 1rem;
        color: var(--subtle-text);
        margin-top: 0.5rem;
      }

      .change-details {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
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
      }

      .additional-count {
        font-style: italic;
        color: var(--sl-color-neutral-600);
        margin-top: 0.25rem;
      }

      .solution-info {
        margin-top: 0.5rem;
      }

      .new-solution-heading {
        font-size: 1rem;
        font-weight: 600;
      }

      .goal-message {
        margin-top: 1rem;
        font-size: 1rem;
      }

      .funding-details {
        margin-top: 0.5rem;
        text-align: center;
        color: var(--sl-color-neutral-700);
      }

      .emoji-large {
        font-size: 1.5rem;
        margin-bottom: 1rem;
      }

      sl-card::part(header) {
        border-bottom-width: 0;
      }

      sl-card::part(body) {
        padding-top: 0;
        font-size: 0.875rem;
      }

      sl-card::part(footer) {
        font-size: 0.8rem;
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
      }

      a {
        color: var(--link);
      }
    `,
  ];

  @property({ type: Object }) change!: Change;

  protected renderSolutionDetails(
    solution: SolutionFieldsFragment | SolutionFieldsDetailedFragment
  ) {
    if (!solution) return html``;

    const progress = calculateProgress(solution as Solution);
    const isCompleted = progress >= 100;
    const deadline = dayjs(solution.deadline * 1000);
    const now = dayjs();

    return html`
      <div class="change-details">
        <div class="goal">
          <sl-progress-bar value="${Math.min(progress, 100)}"></sl-progress-bar>
          <div class="goal-text">
            ${formatAmount(solution.tokensContributed)} out of
            ${formatAmount(solution.fundingGoal)} UPD
          </div>
        </div>
        ${isCompleted
          ? html`
              <sl-badge variant="success" pill>
                <span class="emoji">🥳</span> Funded
              </sl-badge>
            `
          : html``}
        <span class="emoji-badge"
          ><span class="emoji">⏰</span> ${deadline.isBefore(now)
            ? 'expired'
            : deadline.fromNow()}</span
        >
        <span class="emoji-badge"
          ><span class="emoji">💎</span> ${formatAmount(solution.stake)}</span
        >
        <span class="emoji-badge"
          ><span class="emoji">🎁</span> ${formatReward(
            solution.funderReward
          )}</span
        >
      </div>
    `;
  }
}
