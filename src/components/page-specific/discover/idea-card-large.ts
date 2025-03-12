import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { formatUnits, fromHex } from 'viem';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

import seedling from '@icons/seedling.svg';
import gift from '@icons/gift.svg';
import fire from '@icons/fire.svg';

import '@shoelace-style/shoelace/dist/components/icon/icon.js';

import { defaultFunderReward, updraftSettings } from '@/context.ts';
import { Idea, UpdraftSettings } from '@/types';

import { shortNum } from '@/utils.ts';

@customElement('idea-card-large')
export class IdeaCardLarge extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
      color: var(--main-foreground);
    }

    h3 {
      margin-bottom: 0rem;
    }

    .idea a {
      color: inherit;
      text-decoration: none;
    }

    .idea a:hover {
      color: var(--accent);
    }

    .info-row {
      display: flex;
      gap: 1rem;
      padding: 0;
      margin: 0;
    }

    .info-row li {
      list-style: none;
      display: flex;
      align-items: center;
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .tag {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background-color: var(--subtle-background);
      border-radius: 1rem;
      font-size: 0.875rem;
      text-decoration: none;
      color: var(--main-foreground);
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
      <div class="idea">
        <a href="/idea/${id}">
          <h3>${name}</h3>
        </a>
        <a href="/profile/${creator.id}">by ${profile.name || creator.id}</a>
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
        <a href="/idea/${id}">
          ${description ? html` <p>${description}</p>` : ''}
        </a>
      </div>
      ${tags
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
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'idea-card-large': IdeaCardLarge;
  }
}
