import { LitElement } from 'lit';
import { html, SignalWatcher } from '@lit-labs/signals';
import { customElement, property } from 'lit/decorators.js';
import { formatUnits } from 'viem';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import seedling from '@icons/common/seedling.svg';

import '@shoelace-style/shoelace/dist/components/icon/icon.js';

import { updraftSettings } from '@state/common';
import { Idea } from '@/features/idea/types';

import { shortNum } from '@utils/short-num';
import { smallCardStyles } from '@styles/small-card-styles';

@customElement('idea-card-small')
export class IdeaCardSmall extends SignalWatcher(LitElement) {
  static styles = smallCardStyles;

  @property() idea!: Idea;

  render() {
    const { startTime, funderReward, shares, description, id, name } =
      this.idea;
    const pctFunderReward =
      (funderReward * 100) / updraftSettings.get().percentScale;
    const interest = shortNum(formatUnits(shares, 18));
    const date = dayjs(startTime * 1000);
    return html`
      <a href="/idea/${id}">
        <hr />
        <h3>${name}</h3>
        ${description ? html` <p>${description}</p>` : ''}
        <ul class="info-row">
          <li>
            <sl-icon src=${seedling}></sl-icon>
            <span>${date.fromNow()}</span>
          </li>
          ${pctFunderReward
            ? html`
                <li>
                  <span>🎁 ${pctFunderReward.toFixed(0)}%</span>
                </li>
              `
            : ''}
          <li>
            <span>🔥${interest}</span>
          </li>
        </ul>
      </a>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'idea-card-small': IdeaCardSmall;
  }
}
