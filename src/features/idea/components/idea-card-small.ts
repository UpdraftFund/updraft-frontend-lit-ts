import { LitElement } from 'lit';
import { html, SignalWatcher } from '@lit-labs/signals';
import { customElement, property } from 'lit/decorators.js';

import { Idea } from '@/features/idea/types';

import { smallCardStyles } from '@styles/small-card-styles';
import {
  formatReward,
  formatTokenAmount,
  formatDate,
} from '@utils/format-utils';

@customElement('idea-card-small')
export class IdeaCardSmall extends SignalWatcher(LitElement) {
  static styles = smallCardStyles;

  @property() idea!: Idea;
  @property() showReward = true;

  render() {
    const { startTime, funderReward, shares, description, id, name } =
      this.idea;
    const interest = formatTokenAmount(shares);
    const date = formatDate(startTime);

    return html`
      <a href="/idea/${id}">
        <hr />
        <h3>${name}</h3>
        ${description ? html` <p>${description}</p>` : html``}
        <ul class="info-row">
          <li>🌱 ${date.fromNow}</li>
          ${this.showReward
            ? html` <li>🎁 ${formatReward(funderReward)}</li>`
            : html``}
          <li>🔥 ${interest}</li>
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
