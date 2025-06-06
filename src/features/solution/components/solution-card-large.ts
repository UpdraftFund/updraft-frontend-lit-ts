import { LitElement, css } from 'lit';
import { html, SignalWatcher } from '@lit-labs/signals';
import { customElement, property } from 'lit/decorators.js';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';
import '@components/common/formatted-text';

import { Solution } from '@/features/solution/types';

import { largeCardStyles } from '@styles/large-card-styles';

import { formatReward, formatAmount, formatDate } from '@utils/format-utils';
import {
  calculateProgress,
  goalFailed,
  goalReached,
  parseSolutionInfo,
} from '@utils/solution/solution-utils';
import { parseProfile } from '@utils/user/user-utils';

@customElement('solution-card-large')
export class SolutionCardLarge extends SignalWatcher(LitElement) {
  static styles = [
    largeCardStyles,
    css`
      .info-row {
        flex-wrap: wrap;
        align-items: center;
      }

      .progress-container {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        align-items: center;
      }

      .progress-bar {
        width: 100%;
        --height: 8px;
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

      sl-button {
        margin: 0 0 1rem;
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
    if (goalReached(this.solution)) {
      return html`
        <li class="status status-success">
          <span>✅</span>
          <span>Goal Reached!</span>
        </li>
      `;
    }
    if (goalFailed(this.solution)) {
      return html`
        <li class="status status-danger">
          <span>❌</span>
          <span>Goal Failed</span>
        </li>
      `;
    }
    return html``;
  }

  render() {
    const solutionInfo = parseSolutionInfo(this.solution.info);
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
            <h3 class="entity-name">
              ${solutionInfo.name || 'Untitled Solution'}
            </h3>
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
            <sl-progress-bar
              class="progress-bar"
              value="${progress}"
            ></sl-progress-bar>
            <div class="goal-text">${tokensContributed} of ${fundingGoal}</div>
          </li>
          ${this.renderGoalStatus()}
          <li>⏰ Due ${deadline}</li>
          <li>
            <span>💎 ${stake} UPD stake</span>
            <sl-tooltip
              content="💎Stake is divided among funders if a Solution's funding goal isn't reached by the deadline."
            >
              <span class="info-icon">ℹ️</span>
            </sl-tooltip>
          </li>
          <li>
            <span>🎁 ${funderRewardFormatted} funder reward</span>
            <sl-tooltip
              content="The 🎁 funder reward is the percentage of each contribution that is paid to previous contributors."
            >
              <span class="info-icon">ℹ️</span>
            </sl-tooltip>
          </li>
        </ul>

        ${solutionInfo.description
          ? html` <formatted-text class="description"
              >${solutionInfo.description}
            </formatted-text>`
          : html``}
        ${solutionInfo.news
          ? html`
              <div class="news">
                <h4>Latest Updates</h4>
                <formatted-text>${solutionInfo.news}</formatted-text>
              </div>
            `
          : html``}
        ${!goalFailed(this.solution)
          ? html`
              <sl-button variant="primary" href="/solution/${this.solution.id}">
                Fund Solution
              </sl-button>
            `
          : html``}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'solution-card-large': SolutionCardLarge;
  }
}
