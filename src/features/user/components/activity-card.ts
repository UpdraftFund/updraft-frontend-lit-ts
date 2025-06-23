import { customElement, property } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';
import '@shoelace-style/shoelace/dist/components/badge/badge.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';

import '@components/solution/solution-details-bar';
import '@components/common/vertical-fade';

import {
  formatReward,
  formatAmount,
  formatDate,
  formattedText,
} from '@utils/format-utils';
import { goalFailed, parseSolutionInfo } from '@utils/solution/solution-utils';

import { Activity, SolutionInfo } from '@/types';

@customElement('activity-card')
export class ActivityCard extends LitElement {
  static styles = css`
    sl-card {
      --padding: 1rem;
      width: 100%;
    }

    sl-card::part(base) {
      background: var(--card-background);
      border-left: none;
    }

    .action-time {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .action {
      max-width: 70%;
      color: var(--main-foreground);
    }

    .icon-user {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 1rem;
      color: var(--main-foreground);
    }

    .username {
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 16rem;
    }

    .time {
      font-size: 0.875rem;
      color: var(--subtle-text);
    }

    .entity {
      font-weight: 600;
      font-size: 1.25rem;
      line-height: 1.2em;
      color: var(--main-foreground);
      margin-bottom: 0.75rem;
      overflow: hidden;
      text-overflow: ellipsis;
      word-break: break-word;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .entity-link {
      text-decoration: none;
      color: var(--main-foreground);
    }

    .entity-link:hover {
      text-decoration: underline;
      color: var(--accent);
    }

    .description-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    vertical-fade {
      font-size: 0.875rem;
      line-height: 1.5em;
      color: var(--sl-color-neutral-700);
      max-height: 8.25rem;
      --fade-color: var(--card-background);
      --fade-height: 1.25rem;
    }

    .details-bar {
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

    .goal sl-progress-bar {
      --height: 8px;
    }

    .goal-text {
      font-size: 0.75rem;
      color: var(--subtle-text);
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
      padding: 0.125rem;
    }
  `;

  @property() activity!: Activity;
  @property() userId!: `0x${string}`;
  @property() userName!: string;

  private _solutionInfo: SolutionInfo | undefined;

  get solutionInfo(): SolutionInfo | undefined {
    if (!this._solutionInfo) {
      let infoHex: `0x${string}` | undefined;
      if (this.activity.type === 'solutionFunded') {
        infoHex = this.activity.solution.info as `0x${string}`;
      } else if (this.activity.type === 'solutionDrafted') {
        infoHex = this.activity.info as `0x${string}`;
      }
      if (infoHex) {
        this._solutionInfo = parseSolutionInfo(infoHex);
      }
    }
    return this._solutionInfo;
  }

  private getActivityIcon() {
    switch (this.activity.type) {
      case 'ideaCreated':
        return '💡';
      case 'ideaFunded':
        return '🪁';
      case 'solutionFunded':
        return '💸';
      case 'solutionDrafted':
        return '📃';
      default:
        return '✨';
    }
  }

  private getActivityAction() {
    switch (this.activity.type) {
      case 'ideaCreated':
        return `created an Idea`;
      case 'ideaFunded':
        return `supported an Idea with ${formatAmount(this.activity.contribution)} UPD`;
      case 'solutionFunded':
        return `funded a Solution with ${formatAmount(this.activity.contribution)}`;
      case 'solutionDrafted':
        return `drafted a Solution`;
      default:
        return 'Unknown Activity';
    }
  }

  private getDescription() {
    if (this.activity.type === 'ideaCreated') {
      return this.activity.description;
    } else if (this.activity.type === 'ideaFunded') {
      return this.activity.idea.description;
    } else {
      return this.solutionInfo?.description;
    }
  }

  private renderEntity() {
    let href, name;

    if (this.activity.type === 'ideaCreated') {
      href = `/idea/${this.activity.id}`;
      name = this.activity.name;
    } else if (this.activity.type === 'ideaFunded') {
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
    let href, text, solution;
    if (this.activity.type === 'ideaCreated') {
      href = `/idea/${this.activity.id}`;
    } else if (this.activity.type === 'ideaFunded') {
      href = `/idea/${this.activity.idea.id}`;
    } else if (this.activity.type === 'solutionFunded') {
      solution = this.activity.solution;
      href = `/solution/${solution.id}`;
    } else if (this.activity.type === 'solutionDrafted') {
      solution = this.activity;
      href = `/solution/${solution.id}`;
    }

    if (solution && goalFailed(solution)) {
      return html``;
    }

    if (this.activity.type.startsWith('idea')) {
      text = 'Support';
    } else {
      text = 'Fund';
    }

    return html`
      <sl-button variant="primary" size="small" href="${href}"
        >${text}
      </sl-button>
    `;
  }

  private renderDetailsBar() {
    if (
      this.activity.type === 'ideaCreated' ||
      this.activity.type == 'ideaFunded'
    ) {
      let idea;
      if (this.activity.type === 'ideaCreated') {
        idea = this.activity;
      } else {
        idea = this.activity.idea;
      }
      return html`
        <div class="details-bar">
          <span class="emoji-badge"
            ><span class="emoji">🌱</span> Created
            ${formatDate(idea.startTime, 'fromNow')}</span
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
      } else {
        // this.activity.type == 'solutionDrafted'
        solution = this.activity;
      }

      return html` <solution-details-bar
        .solution=${solution}
      ></solution-details-bar>`;
    }
  }

  updated(changedProperties: Map<string | number | symbol, unknown>) {
    if (changedProperties.has('activity')) {
      this._solutionInfo = undefined;
    }
  }

  render() {
    const time = dayjs(this.activity.timestamp).fromNow();
    const description = this.getDescription();
    return html`
      <sl-card>
        <div class="icon-user">
          ${this.getActivityIcon()}
          <span class="username">${this.userName}</span>
        </div>
        <div class="action-time">
          <span class="action">${this.getActivityAction()}</span>
          <span class="time">${time}</span>
        </div>

        <div class="entity">${this.renderEntity()}</div>

        ${description
          ? html` <div class="description-container">
              <vertical-fade>${formattedText(description)}</vertical-fade>
              ${this.renderFundButton()}
            </div>`
          : html``}

        <sl-divider></sl-divider>

        ${this.renderDetailsBar()}
      </sl-card>
    `;
  }
}
