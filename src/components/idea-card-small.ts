import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

import seedling from '@icons/seedling.svg';
import gift from '@icons/gift.svg';
import fire from '@icons/fire.svg';

import '@shoelace-style/shoelace/dist/components/icon/icon.js';

import { shortNum } from "@/utils.ts";

@customElement('idea-card-small')
export class IdeaCardSmall extends LitElement {
  @property() id!: `0x${string}`;
  @property() name!: string;
  @property() description: string | undefined;
  @property() shares!: number;
  @property() funderReward!: number;
  @property() startTime!: number;

  static styles = css`
    :host {
      display: inline-block;
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
      font-size: 0.875rem;
    }
  `;

  render() {
    const date = dayjs(this.startTime * 1000);
    return html`
      <hr>
      <h3>${this.name}</h3>
      ${this.description ? html`<p>${this.description}</p>` : '' }
      <ul class="info-row">
        <li><sl-icon src=${seedling}></sl-icon><span>${date.fromNow()}</span></li>
        <li><sl-icon src=${gift}></sl-icon><span>${this.funderReward.toFixed(0)}%</span></li>
        <li><sl-icon src=${fire}></sl-icon><span>${shortNum(this.shares)}</span></li>
      </ul>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'idea-card-small': IdeaCardSmall;
  }
}