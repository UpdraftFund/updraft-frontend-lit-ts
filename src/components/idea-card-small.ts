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

  @property() id!: `0x${string}`;
  @property() name!: string;
  @property() description: string | undefined;
  @property() shares!: number;
  @property() funderReward!: number;
  @property() startTime!: number;

  render() {
    const date = dayjs(this.startTime * 1000);
    return html`
      <a href="/idea/${this.id}"}>
        <hr>
        <h3>${this.name}</h3>
        ${this.description ? html`<p>${this.description}</p>` : ''}
        <ul class="info-row">
          <li>
            <sl-icon src=${seedling}></sl-icon>
            <span>${date.fromNow()}</span></li>
          <li>
            <sl-icon src=${gift}></sl-icon>
            <span>${this.funderReward.toFixed(0)}%</span></li>
          <li>
            <sl-icon src=${fire}></sl-icon>
            <span>${shortNum(this.shares)}</span></li>
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