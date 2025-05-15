import { customElement, property } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';
import { fromHex } from 'viem';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';
import '@shoelace-style/shoelace/dist/components/badge/badge.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';

import { Activity, Profile, SolutionInfo } from '@/types';
import {
  formatReward,
  calculateProgress,
  parseProfile,
  formatAmount,
  formatDate,
} from '@utils/format-utils';

@customElement('activity-card')
export class ActivityCard extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    sl-card {
      --padding: 1rem;
      width: 100%;
    }

    .action-time {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      margin-bottom: 0.5rem;
    }

    .action {
      font-weight: 500;
      font-size: 1.125rem;
      line-height: 1.44em;
      color: var(--sl-color-neutral-900);
    }

    .time {
      font-size: 0.875rem;
      color: var(--sl-color-neutral-600);
    }

    .entity {
      font-weight: 600;
      font-size: 1.25rem;
      line-height: 1.2em;
      color: var(--sl-color-neutral-900);
      margin-bottom: 0.75rem;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .entity-link {
      text-decoration: none;
      color: var(--sl-color-neutral-900);
    }

    .entity-link:hover {
      text-decoration: underline;
      color: var(--accent);
    }

    .description-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      width: 100%;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .description {
      font-size: 0.875rem;
      line-height: 1.5em;
      color: var(--sl-color-neutral-700);
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
    }

    .details-bar {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      gap: 0.75rem;
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

    sl-badge {
      --sl-font-size-x-small: 0.75rem;
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
  `;

  @property() activity!: Activity;
  @property() userId!: `0x${string}`;
  @property() userName!: string;

  private _creatorProfile: Profile | undefined;
  private _solutionInfo: SolutionInfo | undefined;

  get creatorProfile(): Profile | undefined {
    if (!this._creatorProfile) {
      let profileHex: `0x${string}` | undefined;
      if (this.activity.type === 'ideaFunded') {
        profileHex = this.activity.idea.creator.profile as `0x${string}`;
      } else if (this.activity.type === 'solutionFunded') {
        profileHex = this.activity.solution.drafter.profile as `0x${string}`;
      }
      if (profileHex) {
        this._creatorProfile = parseProfile(profileHex);
      }
    }
    return this._creatorProfile;
  }

  get solutionInfo(): SolutionInfo | undefined {
    if (!this._solutionInfo) {
      let infoHex: `0x${string}` | undefined;
      if (this.activity.type === 'solutionFunded') {
        infoHex = this.activity.solution.info as `0x${string}`;
      } else if (this.activity.type === 'solutionDrafted') {
        infoHex = this.activity.info as `0x${string}`;
      }
      if (infoHex) {
        this._solutionInfo = JSON.parse(fromHex(infoHex, 'string'));
      }
    }
    return this._solutionInfo;
  }

  private getActivityIcon() {
    switch (this.activity.type) {
      case 'ideaFunded':
        return '🪁';
      case 'solutionFunded':
        return '💸';
      case 'solutionDrafted':
        return '📜';
      default:
        return '📝';
    }
  }

  private getActivityAction() {
    switch (this.activity.type) {
      case 'ideaFunded':
        return `${this.userName} supported an Idea with ${formatAmount(this.activity.contribution)} UPD`;
      case 'solutionFunded':
        return `${this.userName} funded a solution with ${formatAmount(this.activity.contribution)} UPD`;
      case 'solutionDrafted':
        return `${this.userName} drafted a solution`;
      default:
        return 'Unknown Activity';
    }
  }

  private getDescription() {
    if (this.activity.type === 'ideaFunded') {
      return this.activity.idea.description;
    } else {
      return this.solutionInfo?.description;
    }
  }

  private formatDeadline(timestamp: number) {
    const now = dayjs();
    const deadline = dayjs(timestamp * 1000);

    let deadlineString = deadline.fromNow();
    if (deadline.isBefore(now)) {
      deadlineString = `❌ ${deadlineString}`;
    }
    return deadlineString;
  }

  private renderEntity() {
    let href, name;

    if (this.activity.type === 'ideaFunded') {
      href = `/idea/${this.activity.idea.id}`;
      name = this.activity.idea.name;
    } else if (this.activity.type === 'solutionFunded') {
      href = `/solution/${this.activity.solution.id}`;
      name = this.solutionInfo?.name || 'Untitled';
    } else if (this.activity.type === 'solutionDrafted') {
      href = `/solution/${this.activity.id}`;
      name = this.solutionInfo?.name || 'Untitled';
    }

    return html`<a href="${href}" class="entity-link">${name}</a>`;
  }

  private renderFundButton() {
    let href, text;
    if (this.activity.type === 'ideaFunded') {
      href = `/idea/${this.activity.idea.id}`;
    } else if (this.activity.type === 'solutionFunded') {
      href = `/solution/${this.activity.solution.id}`;
    } else if (this.activity.type === 'solutionDrafted') {
      href = `/solution/${this.activity.id}`;
    }

    if (this.activity.type === 'ideaFunded') {
      text = 'Support this Idea';
    } else {
      text = 'Fund this Solution';
    }

    return html`
      <sl-button variant="primary" size="small" href="${href}"
        >${text}
      </sl-button>
    `;
  }

  private renderDetailsBar() {
    if (this.activity.type === 'ideaFunded') {
      const idea = this.activity.idea;
      return html`
        <div class="details-bar">
          <span class="emoji-badge"
            ><span class="emoji">🌱</span> Created
            ${formatDate(idea.startTime).fromNow}</span
          >
          <span class="emoji-badge"
            ><span class="emoji">🎁</span>${formatReward(idea.funderReward)}
            Funder Reward</span
          >
          <span class="emoji-badge"
            ><span class="emoji">🔥</span>${formatAmount(idea.shares)}</span
          >
        </div>
      `;
    } else {
      let solution;
      if (this.activity.type === 'solutionFunded') {
        solution = this.activity.solution;
      } else if (this.activity.type == 'solutionDrafted') {
        solution = this.activity;
      }

      const progress = calculateProgress(
        solution?.tokensContributed,
        solution?.fundingGoal
      );
      const isCompleted = progress >= 100;

      return html`
        <div class="details-bar">
          <div class="goal">
            <sl-progress-bar
              value="${Math.min(progress, 100)}"
            ></sl-progress-bar>
            <div class="goal-text">
              ${formatAmount(solution?.tokensContributed)} out of
              ${formatAmount(solution?.fundingGoal)} UPD
            </div>
          </div>
          ${isCompleted
            ? html` <sl-badge variant="success" pill
                ><span class="emoji">🥳</span> Funded
              </sl-badge>`
            : ''}
          <span class="emoji-badge"
            ><span class="emoji">⏰</span> ${this.formatDeadline(
              solution?.deadline
            )}</span
          >
          <span class="emoji-badge"
            ><span class="emoji">🌱</span>${formatDate(
              this.activity.timestamp / 1000
            ).fromNow}</span
          >
          <span class="emoji-badge"
            ><span class="emoji">💎</span> ${formatAmount(
              solution?.stake
            )}</span
          >
          <span class="emoji-badge"
            ><span class="emoji">🎁</span> ${formatReward(
              solution?.funderReward
            )}</span
          >
        </div>
      `;
    }
  }

  updated(changedProperties: Map<string | number | symbol, unknown>) {
    if (changedProperties.has('activity')) {
      this._creatorProfile = undefined;
      this._solutionInfo = undefined;
    }
  }

  render() {
    const date = formatDate(this.activity.timestamp / 1000); // Convert to seconds if needed
    return html`
      <sl-card>
        <div class="action-time">
          <div class="action">
            ${this.getActivityIcon()} ${this.getActivityAction()}
          </div>
          <div class="time">${date.fromNow}</div>
        </div>

        <div class="entity">${this.renderEntity()}</div>

        <div class="description-container">
          <div class="description">${this.getDescription()}</div>
          ${this.renderFundButton()}
        </div>

        <sl-divider></sl-divider>

        ${this.renderDetailsBar()}
      </sl-card>
    `;
  }
}
