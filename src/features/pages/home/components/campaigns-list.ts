import { customElement, state } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';

// Shoelace components
import '@shoelace-style/shoelace/dist/components/card/card';
import '@shoelace-style/shoelace/dist/components/button/button';

// Types
import type { CampaignsRow } from '@/types';

// Utils
import { shortNum } from '@utils/format-utils';

@customElement('campaigns-list')
export class CampaignsList extends LitElement {
  @state() private campaigns: CampaignsRow[] = [];

  static styles = css`
    :host {
      display: contents;
    }
    sl-card {
      --padding: 1.25rem;
    }
    sl-card h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
    }
    sl-card p {
      font-size: 0.875rem;
      line-height: 1.5;
    }
    sl-card::part(base),
    sl-card::part(body) {
      height: 100%;
    }
    sl-card img {
      float: right;
      width: 125px;
      height: auto;
      margin: 0 0 8px 16px;
    }
    .clear-float {
      clear: both;
    }
    sl-card.campaign {
      position: relative;
      --border-radius: 6px 12px 6px 6px;
    }
    sl-card.campaign::part(base) {
      background: linear-gradient(
        135deg,
        var(--sl-color-neutral-0) 0%,
        var(--sl-color-primary-50) 100%
      );
      border: 2px solid var(--border-accent);
    }
    sl-card.campaign::before {
      content: '🚀 Campaign';
      position: absolute;
      top: 0px;
      right: 0px;
      background: var(--badge);
      color: var(--badge-text);
      padding: 0.25rem 0.75rem;
      border-radius: 0 10px;
      font-size: 0.65rem;
      font-weight: 600;
      text-transform: uppercase;
      z-index: 1;
    }
    sl-card.campaign h3 {
      color: var(--accent);
      font-weight: 700;
    }
    sl-card.campaign > h4 {
      font-size: 1rem;
      font-weight: 600;
      margin: 1rem 0 0.5rem 0;
      color: var(--subtle-text);
      border-bottom: 2px solid var(--border-accent);
      padding: 0.25rem;
      max-width: 50%;
    }
    sl-card.campaign .committed-list {
      margin: 0.5rem 0 1rem 0;
      padding-left: 1.25rem;
    }
    .committed-list li {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--main-foreground);
      margin-bottom: 0.25rem;
    }
    .tags {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.25rem;
      padding: 0;
      list-style: none;
      margin: 0;
    }
    .tags h4 {
      font-size: 0.85rem;
      margin: 0 0.25rem 0 0;
      padding: 0.25rem 0 0;
    }
    .tags li {
      background: var(--subtle-background);
      color: var(--main-foreground);
      padding: 0.25rem 0.5rem;
      margin-top: 0.25rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 500;
    }
  `;

  async connectedCallback() {
    super.connectedCallback();
    await this.fetchCampaigns();
  }

  private async fetchCampaigns() {
    try {
      const response = await fetch('/api/campaigns/campaigns');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          this.campaigns = data;
        }
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  }

  private renderCampaign(campaign: CampaignsRow) {
    const data = campaign.data;
    const searchTags = data.tags.map((tag: string) => `[${tag}]`).join(' ');

    return html`
      <sl-card class="campaign">
        ${data.image?.url
          ? html`<img
              src=${data.image.url}
              alt=${data.image.alt || data.name}
            />`
          : ''}
        <h3>${data.name}</h3>
        <p>
          ${data.description}
          ${data.link
            ? html`
                <a href=${data.link.url} target="_blank">${data.link.text}</a>
              `
            : ''}
        </p>
        ${data.funding && data.funding.length > 0
          ? html`
              <h4>Committed</h4>
              <ul class="committed-list">
                ${data.funding.map(
                  (funding) => html`
                    <li>${shortNum(funding.amount)} ${funding.token}</li>
                  `
                )}
              </ul>
            `
          : ''}
        <div class="clear-float"></div>
        <ul class="tags">
          <h4>Tags:</h4>
          ${data.tags.map((tag: string) => html` <li>${tag}</li>`)}
        </ul>
        <sl-button
          slot="footer"
          variant="primary"
          href="/discover?search=${searchTags}"
        >
          Ideas with these tags
        </sl-button>
      </sl-card>
    `;
  }

  render() {
    return html`
      ${this.campaigns.map((campaign) => this.renderCampaign(campaign))}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'campaigns-list': CampaignsList;
  }
}
