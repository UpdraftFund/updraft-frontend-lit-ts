import { html, css, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { formatUnits } from 'viem';
import dayjs from 'dayjs';

import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';

import { shortNum } from '@utils/short-num';
import { Change } from '@/types';
import { SolutionFieldsFragment, SolutionFieldsDetailedFragment } from '@gql';
import { updraftSettings } from '@state/common';

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
    `,
    css`
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
        min-width: 150px;
      }

      .goal-text {
        font-size: 0.75rem;
        color: var(--sl-color-neutral-600);
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

      .person-list {
        margin-top: 0.5rem;
      }

      .person-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.25rem;
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

  // Reusable utility methods
  protected formatAmount(
    amount: string | null | undefined,
    decimals: number = 18
  ): string {
    if (!amount) return '0';
    return shortNum(formatUnits(BigInt(amount), decimals));
  }

  protected formatReward(percentage: string | null | undefined): string {
    if (!percentage) return '0';
    return (
      (Number(percentage) * 100) /
      updraftSettings.get().percentScale
    ).toString();
  }

  protected calculateProgress(
    solution: SolutionFieldsFragment | SolutionFieldsDetailedFragment
  ): number {
    if (!solution?.tokensContributed || !solution?.fundingGoal) {
      return 0;
    }

    const contributed = Number(
      formatUnits(BigInt(solution.tokensContributed), 18)
    );
    const goal = Number(formatUnits(BigInt(solution.fundingGoal), 18));

    if (isNaN(contributed) || isNaN(goal) || goal === 0) {
      return 0;
    }

    return (contributed / goal) * 100;
  }

  protected renderSolutionDetails(
    solution: SolutionFieldsFragment | SolutionFieldsDetailedFragment
  ) {
    if (!solution) return html``;

    const progress = this.calculateProgress(solution);
    const isCompleted = progress >= 100;
    const deadline = dayjs(solution.deadline * 1000);
    const now = dayjs();

    return html`
      <div class="change-details">
        <div class="goal">
          <sl-progress-bar value="${Math.min(progress, 100)}"></sl-progress-bar>
          <div class="goal-text">
            ${this.formatAmount(solution.tokensContributed)} out of
            ${this.formatAmount(solution.fundingGoal)} UPD
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
          ><span class="emoji">💎</span> ${this.formatAmount(
            solution.stake
          )}</span
        >
        <span class="emoji-badge"
          ><span class="emoji">🎁</span> ${this.formatReward(
            solution.funderReward
          )}%</span
        >
      </div>
    `;
  }
}
