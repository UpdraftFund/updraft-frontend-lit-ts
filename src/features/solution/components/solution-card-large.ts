import { LitElement, css } from 'lit';
import { html, SignalWatcher } from '@lit-labs/signals';
import { customElement, property } from 'lit/decorators.js';

import { fromHex } from 'viem';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';

import { Solution, SolutionInfo } from '@/features/solution/types';

import { largeCardStyles } from '@styles/large-card-styles';

import {
  formatReward,
  formatAmount,
  parseProfile,
  formatDate,
  calculateProgress,
} from '@utils/format-utils';

@customElement('solution-card-large')
export class SolutionCardLarge extends SignalWatcher(LitElement) {
  static styles = [
    largeCardStyles,
    css`
      .info-row .progress-container {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        align-items: flex-start;
      }

      .progress-status-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .progress-bar {
        width: 150px;
        flex-shrink: 0;
      }

      .goal-text {
        font-size: 0.9rem;
        color: var(--sl-color-neutral-700);
        white-space: nowrap;
        margin: 0 0.25rem;
      }

      .news {
        margin: 1rem 0;
        padding: 0.75rem;
        background-color: var(--sl-color-neutral-50);
        border-radius: var(--sl-border-radius-medium);
      }

      .news h4 {
        margin-top: 0;
        margin-bottom: 0.5rem;
        font-size: 1rem;
      }

      .fund-button {
        margin-top: 1rem;
      }

      .status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 500;
        white-space: nowrap;
      }

      .status-success {
        color: var(--sl-color-success-600);
      }

      .status-danger {
        color: var(--sl-color-danger-600);
      }

      .idea-link {
        margin-top: 1rem;
        font-size: 0.9rem;
        color: var(--sl-color-neutral-600);
      }

      .idea-link a {
        color: var(--accent);
      }

      .idea-link a:hover {
        text-decoration: underline;
      }
    `,
  ];

  @property() solution!: Solution;

  private renderGoalStatus() {
    const now = dayjs();
    const deadlineDate = dayjs(this.solution.deadline * 1000);
    const progress = calculateProgress(this.solution);

    if (progress >= 100) {
      return html`
        <div class="status status-success">
          <span>✅</span>
          <span>Goal Reached!</span>
        </div>
      `;
    }

    if (now.isAfter(deadlineDate)) {
      return html`
        <div class="status status-danger">
          <span>❌</span>
          <span>Goal Failed</span>
        </div>
      `;
    }

    return html``;
  }

  render() {
    const solutionInfo: SolutionInfo = JSON.parse(
      fromHex(this.solution.info as `0x${string}`, 'string')
    );
    const drafterProfile = parseProfile(
      this.solution.drafter.profile as `0x${string}`
    );
    const deadline = formatDate(this.solution.deadline, 'fromNow');
    const progress = calculateProgress(this.solution);
    const tokensContributed = formatAmount(this.solution.tokensContributed);
    const fundingGoal = formatAmount(this.solution.fundingGoal);
    const stake = formatAmount(this.solution.stake);
    const funderRewardFormatted = formatReward(this.solution.funderReward);

    return html`
      <div class="card">
        <div class="card-header">
          <a href="/solution/${this.solution.id}">
            <h3>${solutionInfo.name || 'Untitled Solution'}</h3>
          </a>
          <div class="byline">
            <a href="/profile/${this.solution.drafter.id}">
              by
              ${drafterProfile.name ||
              drafterProfile.team ||
              this.solution.drafter.id}
            </a>
          </div>
        </div>

        <ul class="info-row">
          <li class="progress-container">
            <div class="goal-text">
              ${tokensContributed} of ${fundingGoal} UPD raised
            </div>
            <div class="progress-status-row">
              <sl-progress-bar
                class="progress-bar"
                value="${Math.min(progress, 100)}"
              ></sl-progress-bar>
              ${this.renderGoalStatus()}
            </div>
          </li>
          <li>⏰ Deadline ${deadline}</li>
          <li>💎 ${stake} UPD stake</li>
          <li>🎁 ${funderRewardFormatted} funder reward</li>
        </ul>

        ${solutionInfo.description
          ? html` <div class="description">${solutionInfo.description}</div>`
          : html``}
        ${solutionInfo.news
          ? html`
              <div class="news">
                <h4>News</h4>
                <p>${solutionInfo.news}</p>
              </div>
            `
          : html``}

        <div class="fund-button">
          <sl-button variant="primary" href="/solution/${this.solution.id}">
            Fund this Solution
          </sl-button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'solution-card-large': SolutionCardLarge;
  }
}
