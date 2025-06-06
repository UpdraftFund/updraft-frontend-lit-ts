import { customElement } from 'lit/decorators.js';
import { html, css, LitElement } from 'lit';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

import { NewSupporters } from '@pages/home/types';

import { changeCardStyles } from '@styles/change-card-styles';

@customElement('new-supporters-card')
export class NewSupportersCard extends LitElement {
  static styles = [
    changeCardStyles,
    css`
      .supporters {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
      }

      .supporters a {
        font-size: 0.85rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `,
  ];

  // Type checking for the change property
  declare change: NewSupporters;

  render() {
    const idea = this.change.idea;
    const supporters = this.change.supporters;
    const additionalCount = this.change.additionalCount || 0;

    return html`
      <sl-card>
        <div slot="header">
          <a class="change-card-heading" href="/idea/${idea.id}"
            >${idea.name}</a
          >
          <div class="change-card-subheading">has new supporters</div>
        </div>
        <div class="supporters">
          ${supporters.map(
            (supporter, index) =>
              html`<a href="/profile/${supporter.id}">${supporter.name}</a>
                ${index < supporters.length - 1 ? html`, ` : html``}`
          )}
          ${additionalCount > 0
            ? html`
                <div class="additional-count">
                  and ${additionalCount} others
                </div>
              `
            : ''}
        </div>
        <div slot="footer">${dayjs(this.change.time).fromNow()}</div>
      </sl-card>
    `;
  }
}

// Register the component
declare global {
  interface HTMLElementTagNameMap {
    'new-supporters-card': NewSupportersCard;
  }
}
