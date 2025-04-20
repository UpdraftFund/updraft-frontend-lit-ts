import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { formatUnits } from 'viem';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

import seedling from '@icons/common/seedling.svg';
import gift from '@icons/common/gift.svg';

import '@shoelace-style/shoelace/dist/components/icon/icon.js';

import { updraftSettings } from '@state/common';
import { Solution } from '@/features/solution/types';
import { UpdraftSettings } from '@/features/common/types';

import { shortNum } from '@utils/short-num';

// Icon imports for status
import xCircleIcon from '@/features/common/assets/icons/x-circle.svg';
// Gauge icons - Assuming we'll select one based on progress
import gaugeMinIcon from '@/features/solution/assets/icons/gauge-min.svg';
import gaugeLowIcon from '@/features/solution/assets/icons/gauge-low.svg';
import gaugeMidIcon from '@/features/solution/assets/icons/gauge-mid.svg';
import gaugeHighIcon from '@/features/solution/assets/icons/gauge-high.svg';

@customElement('solution-card-small')
export class SolutionCardSmall extends LitElement {
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
  @consume({ context: updraftSettings, subscribe: true })
  updraftSettings?: UpdraftSettings;

  private get displayFunderReward(): number {
    // Consume settings safely
    const settings = this.updraftSettings;

    // Check if settings and a positive percentScale are available
    if (!settings || !settings.percentScale || settings.percentScale <= 0) {
      // Log a warning only once or in dev mode if needed, but returning 0 is the key
      // console.warn('Invalid Updraft settings or non-positive percentScale, defaulting funder reward display to 0%.');
      return 0; // Return 0% if settings are missing or scale is invalid
    }

    // Use BigInt for calculation to handle potentially large numbers safely

    // This is an example of AI farted out code blindly adding complexity
    // and bloat.
    // Neither of these numbers is potentially large, and now we're having
    // to use try/catch to handle unexpected errors in an uneeded conversion
    // to big int.
    // It's also checking unnecessarily for division by zero again, when it
    // already returned 0 for that case above.
    try {
      const funderRewardBigInt = BigInt(this.solution.funderReward || 0);
      const percentScaleBigInt = BigInt(settings.percentScale);

      // Multiply by 100n for percentage calculation
      const rewardPercentageBigInt =
        percentScaleBigInt !== 0n
          ? (funderRewardBigInt * 100n) / percentScaleBigInt
          : 0n; // Explicitly handle division by zero for BigInt

      return Number(rewardPercentageBigInt); // Convert final percentage back to Number
    } catch (error) {
      console.error('Error calculating funder reward:', error);
      return 0; // Return 0 in case of unexpected errors during BigInt conversion/calculation
    }
  }

  // Helper to parse the hex-encoded JSON info field safely

  // I guess the AI doesn't know about viem's fromHex utility even though we use
  // it in several other places, so it rolled its own. Will re-roll this same
  // code in every component that needs to parse a json hex blobl?

  private parseSolutionInfo(): { name?: string; description?: string } {
    try {
      const hex = this.solution.info;
      const hexStr = hex.startsWith('0x') ? hex.slice(2) : hex;
      const bytes = new Uint8Array(
        hexStr.match(/.{1,2}/g)!.map((b: string) => parseInt(b, 16))
      );
      const text = new TextDecoder().decode(bytes);
      return JSON.parse(text);
    } catch {
      return {}; // Return empty object on error
    }
  }

  private get solutionTitle(): string {
    const info = this.parseSolutionInfo();
    return info.name || 'Untitled Solution';
  }

  private get solutionDescription(): string | undefined {
    const info = this.parseSolutionInfo();
    return info.description;
  }

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
      goalBigInt > 0n
        ? Number((progressBigInt * 10000n) / goalBigInt) / 100
        : 0;

    if (goalBigInt > 0n && progressBigInt >= goalBigInt) {
      return {
        text: 'Goal Reached',
        icon: html`<sl-icon
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
    const date = dayjs(this.solution.startTime * 1000);
    const description = this.solutionDescription;
    const status = this.statusDisplay;
    return html`
      <a href="/solution/${this.solution.id}">
        <hr />
        <h3>${this.solutionTitle}</h3>
        ${description ? html`<p>${description}</p>` : ''}
        <ul class="info-row">
          <li>
            <sl-icon src=${seedling}></sl-icon>
            <span>${date.fromNow()}</span>
          </li>
          <li>
            <sl-icon src=${gift}></sl-icon>
            <span>${this.displayFunderReward.toFixed(0)}%</span>
          </li>
          <li>
            ${typeof status.icon === 'string'
              ? html`<sl-icon src=${status.icon}></sl-icon>`
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
