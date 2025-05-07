import { LitElement, css } from 'lit';
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

  private renderStatus() {
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
          <li>${this.renderStatus()}</li>
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
