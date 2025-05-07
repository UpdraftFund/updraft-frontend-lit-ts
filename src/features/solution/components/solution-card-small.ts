import { LitElement } from 'lit';
import { html, SignalWatcher } from '@lit-labs/signals';
import { customElement, property } from 'lit/decorators.js';
import { fromHex } from 'viem';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import gaugeMinIcon from '@/features/solution/assets/icons/gauge-min.svg';
import gaugeLowIcon from '@/features/solution/assets/icons/gauge-low.svg';
import gaugeMidIcon from '@/features/solution/assets/icons/gauge-mid.svg';
import gaugeHighIcon from '@/features/solution/assets/icons/gauge-high.svg';

import { Solution } from '@/features/solution/types';

import { smallCardStyles } from '@styles/small-card-styles';
import {
  formatFunderReward,
  formatTokenAmount,
  formatDate,
  calculateProgress,
} from '@utils/format-utils';

@customElement('solution-card-small')
export class SolutionCardSmall extends SignalWatcher(LitElement) {
  static styles = smallCardStyles;

  @property() solution!: Solution;

  private renderGoalProgress() {
    const now = dayjs();
    const deadlineDate = dayjs(this.solution.deadline * 1000);
    const progress = calculateProgress(
      this.solution.tokensContributed,
      this.solution.fundingGoal
    );

    if (progress >= 100) {
      return html`✅ <span>Goal Reached</span>`;
    }
    if (now.isAfter(deadlineDate)) {
      return html`❌ <span>Goal Failed</span>`;
    }
    let gaugeIcon = gaugeMinIcon;
    if (progress >= 75) {
      gaugeIcon = gaugeHighIcon;
    } else if (progress >= 50) {
      gaugeIcon = gaugeMidIcon;
    } else if (progress >= 25) {
      gaugeIcon = gaugeLowIcon;
    }

    // Format the progress text
    const formattedContributed = formatTokenAmount(
      this.solution.tokensContributed
    );
    const formattedGoal = formatTokenAmount(this.solution.fundingGoal);
    const progressText = `${formattedContributed} / ${formattedGoal}`;

    return html` <sl-icon src=${gaugeIcon}></sl-icon
      ><span>${progressText}</span>`;
  }

  render() {
    const info = JSON.parse(
      fromHex(this.solution.info as `0x${string}`, 'string')
    );
    const date = formatDate(this.solution.startTime);
    const name = info.name || 'Untitled Solution';
    const description = info.description;
    const funderRewardFormatted = formatFunderReward(
      this.solution.funderReward
    );

    return html`
      <a href="/solution/${this.solution.id}">
        <hr />
        <h3>${name}</h3>
        ${description ? html`<p>${description}</p>` : ''}
        <ul class="info-row">
          <li>🌱 <span>${date.fromNow}</span></li>
          <li>🎁 <span>${funderRewardFormatted}</span></li>
          <li>${this.renderGoalProgress()}</li>
        </ul>
      </a>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'solution-card-small': SolutionCardSmall;
  }
}
