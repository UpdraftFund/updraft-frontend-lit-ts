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

import '@components/solution/solution-details-bar';

import { formatReward, formatAmount, formatDate } from '@utils/format-utils';
import { goalFailed } from '@utils/solution/solution-utils';

import { Activity, SolutionInfo } from '@/types';

@customElement('activity-card')
export class ActivityCard extends LitElement {
  static styles = css`
    sl-card {
      --padding: 1rem;
      width: 100%;
    }

    .action-time {
      display: flex;
      justify-content: space-between;
      width: 100%;
      margin-bottom: 0.75rem;
    }

    .action {
      font-weight: 500;
      font-size: 1rem;
      color: var(--sl-color-neutral-900);
    }

    .time {
      font-size: 0.875rem;
      color: var(--subtle-text);
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
        return `${this.userName} funded a solution with ${formatAmount(this.activity.contribution)}`;
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
    let href, text, solution;
    if (this.activity.type === 'ideaFunded') {
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

    if (this.activity.type === 'ideaFunded') {
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
    if (this.activity.type === 'ideaFunded') {
      const idea = this.activity.idea;
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
    return html`
      <sl-card>
        <div class="action-time">
          <div class="action">
            ${this.getActivityIcon()} ${this.getActivityAction()}
          </div>
          <div class="time">${time}</div>
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
