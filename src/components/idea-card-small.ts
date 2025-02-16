import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { consume } from "@lit/context";
import { formatUnits } from "viem";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

import seedling from '@icons/seedling.svg';
import gift from '@icons/gift.svg';
import fire from '@icons/fire.svg';

import '@shoelace-style/shoelace/dist/components/icon/icon.js';

import { updraftSettings } from '@/context.ts';
import { Idea, UpdraftSettings } from '@/types';

import { shortNum } from "@/utils.ts";

@customElement('idea-card-small')
export class IdeaCardSmall extends LitElement {
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
      font-size: .9rem;
      font-weight: 700;
    }
    
    p {
      margin-top: .5rem;
      font-size: .75rem;
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
  @consume({ context: updraftSettings, subscribe: true }) updraftSettings!: UpdraftSettings;

  private get displayFunderReward(): number {
    return this.idea.funderReward * 100 / this.updraftSettings.percentScale;
  }

  private get displayShares(): string {
    return shortNum(formatUnits(this.idea.shares, 18));
  }

  render() {
    const date = dayjs(this.idea.startTime * 1000);
    return html`
      <a href="/idea/${this.idea.id}"}>
        <hr>
        <h3>${this.idea.name}</h3>
        ${this.idea.description ? html`<p>${this.idea.description}</p>` : ''}
        <ul class="info-row">
          <li>
            <sl-icon src=${seedling}></sl-icon>
            <span>${date.fromNow()}</span></li>
          <li>
            <sl-icon src=${gift}></sl-icon>
            <span>${this.displayFunderReward.toFixed(0)}%</span></li>
          <li>
            <sl-icon src=${fire}></sl-icon>
            <span>${this.displayShares}</span></li>
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