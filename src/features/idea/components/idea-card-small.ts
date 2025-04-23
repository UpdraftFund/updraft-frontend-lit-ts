import { LitElement, css } from 'lit';
import { html, SignalWatcher } from '@lit-labs/signals';
import { customElement, property } from 'lit/decorators.js';
import { formatUnits } from 'viem';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import seedling from '@icons/common/seedling.svg';

import '@shoelace-style/shoelace/dist/components/icon/icon.js';

import { defaultFunderReward, updraftSettings } from '@state/common';
import { Idea } from '@/features/idea/types';

import { shortNum } from '@utils/short-num';

@customElement('idea-card-small')
export class IdeaCardSmall extends SignalWatcher(LitElement) {
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

  @property() idea!: Idea;

  render() {
    const { startTime, funderReward, shares, description, id, name } =
      this.idea;
    let pctFunderReward;
    if (funderReward != defaultFunderReward.get()) {
      pctFunderReward =
        (funderReward * 100) / updraftSettings.get().percentScale;
    }
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
