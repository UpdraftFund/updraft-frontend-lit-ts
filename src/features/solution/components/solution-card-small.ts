import { LitElement, css } from 'lit';
import { html, SignalWatcher } from '@lit-labs/signals';
import { customElement, property } from 'lit/decorators.js';
import { fromHex } from 'viem';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

import '@shoelace-style/shoelace/dist/components/icon/icon.js';

import gaugeMinIcon from '@icons/solution/gauge-min.svg';
import gaugeLowIcon from '@icons/solution/gauge-low.svg';
import gaugeMidIcon from '@icons/solution/gauge-mid.svg';
import gaugeHighIcon from '@icons/solution/gauge-high.svg';

import { Solution } from '@/features/solution/types';

import { smallCardStyles } from '@styles/small-card-styles';
import {
  formatDate,
  calculateProgress,
  formatAmount,
} from '@utils/format-utils';

@customElement('solution-card-small')
export class SolutionCardSmall extends SignalWatcher(LitElement) {
  static styles = [
    smallCardStyles,
    css`
      sl-icon {
        font-size: 1.5rem;
        color: var(--main-foreground);
      }
    `,
  ];

  @property() solution!: Solution;
  @property() showStake = true;

  private renderGoalProgress() {
    const now = dayjs();
    const deadlineDate = dayjs(this.solution.deadline * 1000);
    const progress = calculateProgress(this.solution);

    if (progress >= 100) {
      return html`✅ Goal Reached!`;
    }
    if (now.isAfter(deadlineDate)) {
      return html`❌ Goal Failed`;
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
    const formattedContributed = formatAmount(this.solution.tokensContributed);
    const formattedGoal = formatAmount(this.solution.fundingGoal);
    const progressText = `${formattedContributed} / ${formattedGoal}`;

    return html` <sl-icon src=${gaugeIcon}></sl-icon>${progressText}`;
  }

  render() {
    const { info: infoRaw, deadline, id, stake } = this.solution;
    const info = JSON.parse(fromHex(infoRaw as `0x${string}`, 'string'));
    const name = info.name || 'Untitled Solution';
    const deadlineDate = formatDate(deadline, 'fromNow');
    const description = info.description;

    return html`
      <a href="/solution/${id}">
        <hr />
        <h3>${name}</h3>
        ${description ? html`<p>${description}</p>` : html``}
        <ul class="info-row">
          <li>⏰ ${deadlineDate}</li>
          ${this.showStake ? html` <li>💎 ${formatAmount(stake)}</li>` : html``}
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
