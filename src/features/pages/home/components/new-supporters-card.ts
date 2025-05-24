import { customElement } from 'lit/decorators.js';
import { html, css, LitElement } from 'lit';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

import { NewSupporters } from '@pages/home/types';
import { shortenAddress } from '@utils/format-utils';
import { changeCardStyles } from '@styles/change-card-styles';

@customElement('new-supporters-card')
export class NewSupportersCard extends LitElement {
  static styles = [
    changeCardStyles,
    css`
      .supporters {
        font-size: 0.85rem;
        text-overflow: ellipsis;
        overflow: hidden;
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
            (supporter, index) => html`
              ${supporter.name
                ? html`<a href="/profile/${supporter.id}">${supporter.name}</a>`
                : html`<a href="/profile/${supporter.id}"
                    >${shortenAddress(supporter.id)}</a
                  >`}${index < supporters.length - 1 ? html`, ` : html``}
            `
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
