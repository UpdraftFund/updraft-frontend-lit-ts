import { LitElement, css, TemplateResult } from 'lit';
import { html, SignalWatcher } from '@lit-labs/signals';
import { customElement, property } from 'lit/decorators.js';
import { formatUnits, fromHex } from 'viem';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import seedling from '@icons/common/seedling.svg';

import '@shoelace-style/shoelace/dist/components/icon/icon.js';

import { updraftSettings } from '@state/common';
import { Solution } from '@/features/solution/types';

import { shortNum } from '@utils/short-num';

// Icon imports for status
import xCircleIcon from '@/features/common/assets/icons/x-circle.svg';
// Gauge icons - Assuming we'll select one based on progress
import gaugeMinIcon from '@/features/solution/assets/icons/gauge-min.svg';
import gaugeLowIcon from '@/features/solution/assets/icons/gauge-low.svg';
import gaugeMidIcon from '@/features/solution/assets/icons/gauge-mid.svg';
import gaugeHighIcon from '@/features/solution/assets/icons/gauge-high.svg';

@customElement('solution-card-small')
export class SolutionCardSmall extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      display: inline-block;
      color: var(--main-foreground);
    }

    a {
      display: block;
      text-decoration: none;
      color: inherit;
    }

    a:hover h3 {
      text-decoration: underline;
      color: var(--accent);
    }

    hr {
      height: 1px;
      background-color: var(--layout-divider); /* Line color */
      border: none;
    }

    h3 {
      margin-top: 0;
      font-size: 0.9rem;
      font-weight: 700;
    }

    p {
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: var(--subtle-text);
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      list-style: none;
      padding: 0;
    }

    .info-row li {
      display: flex;
      align-items: center;
      gap: 2px;
    }

    .info-row span {
      font-size: 0.8rem;
    }
  `;

  @property() solution!: Solution;

  private get statusDisplay(): {
    text: string;
    icon: string | TemplateResult;
  } {
    const now = dayjs();
    const deadlineDate = dayjs(this.solution.deadline * 1000);

    // Treat progress and goal as bigints for accuracy and compatibility with formatUnits
    const progressBigInt = BigInt(this.solution.progress || 0);
    const goalBigInt = BigInt(this.solution.fundingGoal || 0);

    // Calculate percentage using BigInt math to avoid precision issues, then convert
    const progressPercent =
      goalBigInt > 0n ? Number(progressBigInt / goalBigInt) * 100 : 0;

    if (goalBigInt > 0n && progressBigInt >= goalBigInt) {
      return {
        text: 'Goal Reached',
        icon: html` <sl-icon
          name="check-circle-fill"
          style="color: var(--sl-color-success-600);"
        ></sl-icon>`,
      };
    }

    if (now.isAfter(deadlineDate)) {
      return { text: 'Goal Failed', icon: xCircleIcon };
    }

    // Determine which gauge icon to use
    let gaugeIcon = gaugeMinIcon;
    if (progressPercent >= 75) {
      gaugeIcon = gaugeHighIcon;
    } else if (progressPercent >= 50) {
      gaugeIcon = gaugeMidIcon;
    } else if (progressPercent >= 25) {
      gaugeIcon = gaugeLowIcon;
    }

    return {
      text: `${shortNum(formatUnits(this.solution.tokensContributed, 18))} / ${shortNum(formatUnits(goalBigInt, 18))}`,
      icon: gaugeIcon,
    };
  }

  render() {
    const info = JSON.parse(
      fromHex(this.solution.info as `0x${string}`, 'string')
    );
    const date = dayjs(this.solution.startTime * 1000);
    const name = info.name || 'Untitled Solution';
    const description = info.description;
    const status = this.statusDisplay;
    const pctFunderReward =
      (this.solution.funderReward * 100) / updraftSettings.get().percentScale;
    return html`
      <a href="/solution/${this.solution.id}">
        <hr />
        <h3>${name}</h3>
        ${description ? html`<p>${description}</p>` : ''}
        <ul class="info-row">
          <li>
            <sl-icon src=${seedling}></sl-icon>
            <span>${date.fromNow()}</span>
          </li>
          <li>
            🎁
            <span>${pctFunderReward.toFixed(0)}%</span>
          </li>
          <li>
            ${typeof status.icon === 'string'
              ? html` <sl-icon src=${status.icon}></sl-icon>`
              : status.icon}
            <span>${status.text}</span>
          </li>
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
