import { LitElement } from 'lit';
import { html, SignalWatcher } from '@lit-labs/signals';
import { customElement, property } from 'lit/decorators.js';
import { formatUnits, fromHex } from 'viem';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import gaugeMinIcon from '@/features/solution/assets/icons/gauge-min.svg';
import gaugeLowIcon from '@/features/solution/assets/icons/gauge-low.svg';
import gaugeMidIcon from '@/features/solution/assets/icons/gauge-mid.svg';
import gaugeHighIcon from '@/features/solution/assets/icons/gauge-high.svg';

import { updraftSettings } from '@state/common';
import { Solution } from '@/features/solution/types';

import { shortNum } from '@utils/short-num';
import { smallCardStyles } from '@styles/small-card-styles';

@customElement('solution-card-small')
export class SolutionCardSmall extends SignalWatcher(LitElement) {
  static styles = smallCardStyles;

  @property() solution!: Solution;

  private renderGoalProgress() {
    const now = dayjs();
    const deadlineDate = dayjs(this.solution.deadline * 1000);

    // Treat progress and goal as bigints for accuracy and compatibility with formatUnits
    const tokensContributed = BigInt(this.solution.tokensContributed || 0);
    const goalBigInt = BigInt(this.solution.fundingGoal || 0);

    if (goalBigInt > 0n && tokensContributed >= goalBigInt) {
      return html`✅ <span>Goal Reached</span>`;
    }

    if (now.isAfter(deadlineDate)) {
      return html`❌ <span>Goal Failed</span>`;
    }

    const progressPercent =
      goalBigInt > 0n ? Number(tokensContributed / goalBigInt) * 100 : 0;

    // Determine which gauge icon to use
    let gaugeIcon = gaugeMinIcon;
    if (progressPercent >= 75) {
      gaugeIcon = gaugeHighIcon;
    } else if (progressPercent >= 50) {
      gaugeIcon = gaugeMidIcon;
    } else if (progressPercent >= 25) {
      gaugeIcon = gaugeLowIcon;
    }

    const progressText = `${shortNum(formatUnits(tokensContributed, 18))} / ${shortNum(formatUnits(goalBigInt, 18))}`;

    return html` <sl-icon src=${gaugeIcon}></sl-icon
      ><span>${progressText}</span>`;
  }

  render() {
    const info = JSON.parse(
      fromHex(this.solution.info as `0x${string}`, 'string')
    );
    const date = dayjs(this.solution.startTime * 1000);
    const name = info.name || 'Untitled Solution';
    const description = info.description;
    const pctFunderReward =
      (this.solution.funderReward * 100) / updraftSettings.get().percentScale;
    return html`
      <a href="/solution/${this.solution.id}">
        <hr />
        <h3>${name}</h3>
        ${description ? html`<p>${description}</p>` : ''}
        <ul class="info-row">
          <li>🌱 <span>${date.fromNow()}</span></li>
          <li>🎁 <span>${pctFunderReward.toFixed(0)}%</span></li>
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
