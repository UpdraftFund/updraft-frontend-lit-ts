import { LitElement } from 'lit';
import { html, SignalWatcher } from '@lit-labs/signals';
import { customElement, property } from 'lit/decorators.js';

import seedling from '@icons/common/seedling.svg';

import '@shoelace-style/shoelace/dist/components/icon/icon.js';

import { Idea } from '@/features/idea/types';

import { smallCardStyles } from '@styles/small-card-styles';
import {
  formatFunderReward,
  formatTokenAmount,
  formatDate,
} from '@utils/format-utils';

@customElement('idea-card-small')
export class IdeaCardSmall extends SignalWatcher(LitElement) {
  static styles = smallCardStyles;

  @property() idea!: Idea;

  render() {
    const { startTime, funderReward, shares, description, id, name } =
      this.idea;
    const funderRewardFormatted = formatFunderReward(funderReward);
    const interest = formatTokenAmount(shares);
    const date = formatDate(startTime);

    return html`
      <a href="/idea/${id}">
        <hr />
        <h3>${name}</h3>
        ${description ? html` <p>${description}</p>` : ''}
        <ul class="info-row">
          <li>
            <sl-icon src=${seedling}></sl-icon>
            <span>${date.fromNow}</span>
          </li>
          ${funderReward
            ? html`
                <li>
                  <span>🎁 ${funderRewardFormatted}</span>
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
