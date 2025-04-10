import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { formatUnits, fromHex } from 'viem';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

import seedling from '@icons/common/seedling.svg';
import gift from '@icons/common/gift.svg';
import fire from '@icons/common/fire.svg';

import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';

import {
  defaultFunderReward,
  updraftSettings,
} from '@/features/common/state/context';
import { Idea } from '@/features/idea/types';
import { UpdraftSettings } from '@/features/common/types';

import { shortNum } from '@utils/short-num.ts';

@customElement('idea-card-large')
export class IdeaCardLarge extends LitElement {
  static styles = css`
    :host {
      display: block;
      color: var(--main-foreground);
    }

    .idea-card {
      background-color: var(--sl-color-neutral-0);
      border-radius: 0.5rem;
      box-shadow: var(--sl-shadow-x-small);
      overflow: hidden;
      padding: 1.5rem;
      width: 100%;
      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
    }

    .idea-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--sl-shadow-small);
    }

    .idea-header {
      margin-bottom: 1rem;
    }

    h3 {
      margin-top: 0;
      margin-bottom: 0.25rem;
      font-size: 1.25rem;
      font-weight: 600;
      line-height: 1.4;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    a:hover {
      color: var(--accent);
    }

    .byline {
      color: var(--sl-color-neutral-600);
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }

    .info-row {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      padding: 0;
      margin: 0 0 1rem 0;
    }

    .info-row li {
      list-style: none;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.9rem;
      color: var(--sl-color-neutral-700);
    }

    .description {
      margin-bottom: 1.5rem;
      line-height: 1.5;
    }

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
  `;

  @property() idea!: Idea;
  @consume({ context: updraftSettings, subscribe: true })
  updraftSettings?: UpdraftSettings;

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
    let pctFunderReward;
    if (funderReward != defaultFunderReward && this.updraftSettings) {
      pctFunderReward =
        (funderReward * 100) / this.updraftSettings.percentScale;
    }
    const interest = shortNum(formatUnits(shares, 18));
    const profile = JSON.parse(
      fromHex(creator.profile as `0x${string}`, 'string')
    );
    const date = dayjs(startTime * 1000);

    return html`
      <div class="idea-card">
        <div class="idea-header">
          <a href="/idea/${id}">
            <h3>${name}</h3>
          </a>
          <div class="byline">
            <a href="/profile/${creator.id}"
              >by ${profile.name || creator.id}</a
            >
          </div>
        </div>

        <ul class="info-row">
          <li>
            <sl-icon src=${seedling}></sl-icon>
            <span class="created"
              >Created ${date.format('MMM D, YYYY [at] h:mm A UTC')}
              (${date.fromNow()})</span
            >
          </li>
          ${pctFunderReward
            ? html`
                <li>
                  <sl-icon src=${gift}></sl-icon>
                  <span>${pctFunderReward.toFixed(0)}% funder reward</span>
                </li>
              `
            : ''}
          <li>
            <sl-icon src=${fire}></sl-icon>
            <span>${interest}</span>
          </li>
        </ul>

        ${description
          ? html`<div class="description">${description}</div>`
          : ''}
        ${tags && tags.length > 0
          ? html`
              <div class="tags">
                ${tags.map(
                  (tag) => html`
                    <a href="/discover?tab=search&search=[${tag}]" class="tag"
                      >${tag}</a
                    >
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
