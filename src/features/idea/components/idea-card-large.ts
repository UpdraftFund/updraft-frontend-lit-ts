import { LitElement, css } from 'lit';
import { html, SignalWatcher } from '@lit-labs/signals';
import { customElement, property } from 'lit/decorators.js';

import '@shoelace-style/shoelace/dist/components/icon/icon.js';

import { Idea } from '@/features/idea/types';

import { largeCardStyles } from '@styles/large-card-styles';
import { formatReward, formatAmount, formatDate } from '@utils/format-utils';
import { parseProfile } from '@utils/user/user-utils';

@customElement('idea-card-large')
export class IdeaCardLarge extends SignalWatcher(LitElement) {
  static styles = [
    largeCardStyles,
    css`
      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 1rem;
      }

      .tag {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        background-color: var(--subtle-background);
        border-radius: 1rem;
        font-size: 0.875rem;
        text-decoration: none;
        color: var(--main-foreground);
        transition:
          background-color 0.2s ease,
          color 0.2s ease;
      }

      .tag:hover {
        background-color: var(--accent);
        color: var(--sl-color-neutral-0);
      }
    `,
  ];

  @property() idea!: Idea;

  render() {
    const {
      startTime,
      funderReward,
      shares,
      creator,
      tags,
      description,
      id,
      name,
    } = this.idea;

    const funderRewardFormatted = formatReward(funderReward);
    const interest = formatAmount(shares);
    const profile = parseProfile(creator.profile as `0x${string}`);
    const date = formatDate(startTime, 'full');

    return html`
      <div class="card">
        <div class="card-header">
          <a href="/idea/${id}">
            <h3>${name}</h3>
          </a>
          <div class="byline">
            <a href="/profile/${creator.id}"
              >by ${profile.name || profile.team || creator.id}</a
            >
          </div>
        </div>

        <ul class="info-row">
          <li>🌱 <span class="created">${date}</span></li>
          ${funderRewardFormatted
            ? html`
                <li>
                  <span>🎁 ${funderRewardFormatted} funder reward</span>
                </li>
              `
            : ''}
          <li>🔥 <span>${interest}</span></li>
        </ul>

        ${description
          ? html` <div class="description">${description}</div>`
          : ''}
        ${tags && tags.length > 0
          ? html`
              <div class="tags">
                ${tags.map(
                  (tag) => html`
                    <a href="/discover?search=[${tag}]" class="tag">${tag}</a>
                  `
                )}
              </div>
            `
          : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'idea-card-large': IdeaCardLarge;
  }
}
