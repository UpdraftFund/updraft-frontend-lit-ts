import { LitElement, css } from 'lit';
import { html, SignalWatcher } from '@lit-labs/signals';
import { customElement, property } from 'lit/decorators.js';
import { formatUnits, fromHex } from 'viem';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';

import { updraftSettings } from '@state/common';
import { Solution, SolutionInfo } from '@/features/solution/types';
import { Profile } from '@/features/user/types';

import { shortNum } from '@utils/short-num';

@customElement('solution-card-large')
export class SolutionCardLarge extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      display: block;
      color: var(--main-foreground);
    }

    .solution-card {
      background-color: var(--sl-color-neutral-0);
      overflow: hidden;
      padding: 1.5rem;
      width: 100%;
      border-bottom: 1px solid var(--border-default);
    }

    .solution-header {
      margin-bottom: 1rem;
    }

    h3 {
      margin-top: 0;
      margin-bottom: 0.25rem;
      font-size: 1.25rem;
      font-weight: 600;
      line-height: 1.4;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    a:hover {
      color: var(--accent);
    }

    .byline {
      color: var(--sl-color-neutral-600);
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }

    .info-row {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      padding: 0;
      margin: 0 0 1rem 0;
      align-items: flex-end;
    }

    .info-row li {
      list-style: none;
      display: flex;
      gap: 0.25rem;
      font-size: 0.9rem;
      color: var(--sl-color-neutral-700);
    }

    .description {
      margin-bottom: 1.5rem;
      line-height: 1.5;
    }

    .progress-container {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      margin-right: 1rem;
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
      margin-top: 0.25rem;
      padding-left: 0.5rem;
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

    .status-progress {
      color: var(--sl-color-primary-600);
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
  `;

  @property() solution!: Solution;

  private calculateProgress(): number {
    if (!this.solution?.tokensContributed || !this.solution?.fundingGoal) {
      return 0;
    }

    const tokensContributed = BigInt(this.solution.tokensContributed);
    const fundingGoal = BigInt(this.solution.fundingGoal);

    if (fundingGoal === 0n) return 0;
    return Number((tokensContributed * 100n) / fundingGoal);
  }

  private renderGoalStatus() {
    const now = dayjs();
    const deadlineDate = dayjs(this.solution.deadline * 1000);
    const progress = this.calculateProgress();

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
    // Parse the solution info from the hex-encoded JSON string
    const solutionInfo: SolutionInfo = JSON.parse(
      fromHex(this.solution.info as `0x${string}`, 'string')
    );

    // Parse the drafter profile from the hex-encoded JSON string
    let drafterProfile: Profile = { name: '', team: '' };
    if (this.solution.drafter.profile) {
      try {
        drafterProfile = JSON.parse(
          fromHex(this.solution.drafter.profile as `0x${string}`, 'string')
        );
      } catch (e) {
        console.error('Error parsing drafter profile', e);
      }
    }

    // Format dates
    const start = dayjs(this.solution.startTime * 1000);
    const deadline = dayjs(this.solution.deadline * 1000);

    // Calculate funding progress
    const progress = this.calculateProgress();

    // Format amounts
    const tokensContributed = shortNum(
      formatUnits(this.solution.tokensContributed, 18)
    );
    const fundingGoal = shortNum(formatUnits(this.solution.fundingGoal, 18));
    const stake = shortNum(formatUnits(this.solution.stake, 18));

    // Calculate funder reward percentage
    const pctFunderReward =
      (this.solution.funderReward * 100) / updraftSettings.get().percentScale;

    return html`
      <div class="solution-card">
        <div class="solution-header">
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
          <li>
            <span>⏰ Deadline ${deadline.fromNow()}</span>
          </li>
          <li>
            <span class="created"> 🌱 Created ${start.fromNow()} </span>
          </li>
          <li>
            <span>🎁 ${pctFunderReward.toFixed(0)}% funder reward</span>
          </li>
          <li>
            <span>💎 ${stake} UPD stake</span>
          </li>
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
